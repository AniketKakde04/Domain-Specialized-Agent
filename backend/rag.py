import os
import logging
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_community.document_loaders import CSVLoader, WebBaseLoader,PyMuPDFLoader
from langchain_community.document_loaders import SQLDatabaseLoader
from langchain_community.utilities import SQLDatabase
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_classic.chains import create_retrieval_chain 
from langchain_classic.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate
import csv
from langchain_core.documents import Document

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize embeddings once
embeddings = HuggingFaceEmbeddings(model_name="all-miniLM-L6-v2")

VECTOR_STORAGE_PATH = "./chroma_db"


def ingest_file(file_path: str, bot_id: str, sql_query: str = None):
    """ 
    Reads PDF / CSV / SQL / URL, splits it and stores vectors in ChromaDB
    under a collection name 'bot_id'.
    Returns (success: bool, result: any).
    """
    try:
        logger.info(f"Ingesting file: {file_path} for bot_id: {bot_id}")

        # -------- Loader Selection --------
        docs = []
        if file_path.startswith("https://") or file_path.startswith("http://"):
            loader = WebBaseLoader(f"https://r.jina.ai/{file_path}")
            docs = loader.load()

        elif file_path.lower().endswith(".pdf"):
            loader = PyMuPDFLoader(file_path)
            docs = loader.load()

        elif file_path.lower().endswith(".csv"):
            with open(file_path, newline='', encoding='utf-8-sig') as csvfile:
                reader = csv.DictReader(csvfile)
                for row in reader:
                    # 1. Custom parsing for the KCC Dataset
                    if 'QueryText' in row and 'KccAns' in row:
                        content = f"Farmer Issue: {row['QueryText']}\nSolution: {row['KccAns']}"
                    
                    # 2. Custom parsing for the Govt Schemes Dataset
                    elif 'details' in row and 'benefits' in row:
                        content = f"Scheme Name: {row.get('scheme_name', '')}\nDetails: {row['details']}\nBenefits: {row['benefits']}\nEligibility: {row.get('eligibility', '')}"
                    
                    # 3. Fallback for any other random CSV uploaded via No-Code UI
                    else:
                        content = "\n".join([f"{k}: {v}" for k, v in row.items() if v])
                        
                    docs.append(Document(page_content=content, metadata={"source": file_path}))

        else:
            return False, "Unsupported file type or database URI."

        if not docs:
            logger.warning("No documents found.")
            return False, "No documents found."

        # -------- Split Text --------
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=2000,
            chunk_overlap=300
        )

        splits = text_splitter.split_documents(docs)
        splits = [doc for doc in splits if len(doc.page_content.strip()) > 10] 

        if not splits:
            logger.warning("No significant text chunks found (PDF might be image-only).")
            return False, "No readable text found."

        # -------- Store Vectors --------
        Chroma.from_documents(
            documents=splits,
            embedding=embeddings,
            persist_directory=VECTOR_STORAGE_PATH,
            collection_name=bot_id
        )

        logger.info(f"Successfully ingested {len(splits)} chunks.")
        return True, len(splits)

    except Exception as e:
        logger.error(f"Error ingesting file: {e}")
        return False, str(e)


def get_answer(bot_id: str, question: str, api_key: str, system_prompt: str = None, image_base64: str = None):
    """ 
    Returns the answer to the question using RAG, with multimodal support.
    """
    try:
        vectorstore = Chroma(
            persist_directory=VECTOR_STORAGE_PATH,
            collection_name=bot_id,
            embedding_function=embeddings
        )

        retriever = vectorstore.as_retriever(search_kwargs={"k": 15})
        retrieved_docs = retriever.invoke(question)
        
        context = "\n\n".join([doc.page_content for doc in retrieved_docs])
        
        llm = ChatGoogleGenerativeAI(
            google_api_key=api_key,
            model="gemini-2.5-flash",
            temperature=0.7
        )

        sys_prompt = system_prompt if system_prompt else "You are a helpful agricultural AI assistant."
        
        formatted_prompt = f"""{sys_prompt}
        
        Use the following context to answer the user's question.
        The context might contain information in regional languages (like Marathi or Hindi). Translate and understand them contextually to answer the user.
        If the user asks a general question (e.g., about "wilt") and the context contains solutions specific to certain crops, please list the solutions for those specific crops.
        If the answer is not in the context, politely say you don't know.
        
        Context:
        {context}
        """

        messages = [
            SystemMessage(content=formatted_prompt)
        ]
        
        if image_base64:
            # Drop the data MIME type header if it comes from the frontend, Langchain base64 expects raw
            clean_b64 = image_base64.split(",")[1] if "," in image_base64 else image_base64
            
            messages.append(HumanMessage(content=[
                {"type": "text", "text": question},
                {"type": "image_url", "image_url": f"data:image/jpeg;base64,{clean_b64}"}
            ]))
        else:
            messages.append(HumanMessage(content=question))

        response = llm.invoke(messages)
        
        final_content = response.content
        if isinstance(final_content, list):
            final_content = " ".join([c.get("text", "") if isinstance(c, dict) else str(c) for c in final_content])
        elif not isinstance(final_content, str):
            final_content = str(final_content)
            
        return final_content

    except Exception as e:
        logger.error(f"Error getting answer: {e}")
        import traceback
        traceback.print_exc()
        return f"I encountered an error retrieving the answer: {str(e)}"


def delete_bot_data(bot_id: str):
    """
    Deletes the vector store collection for the bot.
    """
    try:
        logger.info(f"Deleting vector data for bot: {bot_id}")
        Chroma(
            persist_directory=VECTOR_STORAGE_PATH,
            collection_name=bot_id,
            embedding_function=embeddings
        ).delete_collection()
        return True
    except Exception as e:
        logger.error(f"Error deleting bot data: {e}")
        return False
	