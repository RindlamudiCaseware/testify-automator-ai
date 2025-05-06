
// ChromaDB Client for vector database operations
import { toast } from "sonner";

// Mock ChromaDB API client - replace with actual ChromaDB client in production
const CHROMA_API_ENDPOINT = "https://api.chromadb.io/v1";  // Replace with your actual endpoint

// Interface for collection data
interface Collection {
  id: string;
  name: string;
  metadata: Record<string, any>;
}

// Interface for document data
interface Document {
  id: string;
  document: string;
  metadata: Record<string, any>;
  embedding?: number[];
}

// Query results interface
interface QueryResult {
  ids: string[][];
  documents: string[][];
  metadatas: Record<string, any>[][];
  distances: number[][];
}

/**
 * ChromaDB client wrapper
 */
export class ChromaClient {
  private apiKey: string = "";
  private baseUrl: string = CHROMA_API_ENDPOINT;
  
  constructor(apiKey: string = "", baseUrl: string = CHROMA_API_ENDPOINT) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }
  
  /**
   * Set API key for ChromaDB
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }
  
  /**
   * Make authenticated request to ChromaDB
   */
  private async makeRequest(
    path: string, 
    method: string = 'GET', 
    body?: any
  ): Promise<any> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }
      
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      
      if (!response.ok) {
        throw new Error(`ChromaDB API error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("ChromaDB request error:", error);
      toast.error("Error connecting to ChromaDB");
      throw error;
    }
  }
  
  /**
   * List all collections
   */
  async listCollections(): Promise<Collection[]> {
    try {
      const response = await this.makeRequest('/collections');
      return response.collections || [];
    } catch (error) {
      console.error("Error listing collections:", error);
      return [];
    }
  }
  
  /**
   * Create a new collection
   */
  async createCollection(name: string, metadata: Record<string, any> = {}): Promise<Collection> {
    try {
      const response = await this.makeRequest('/collections', 'POST', {
        name,
        metadata,
      });
      
      toast.success(`Collection "${name}" created successfully`);
      return response;
    } catch (error) {
      console.error("Error creating collection:", error);
      throw error;
    }
  }
  
  /**
   * Add documents to a collection
   */
  async addDocuments(
    collectionName: string,
    documents: string[],
    metadatas: Record<string, any>[],
    ids?: string[]
  ): Promise<void> {
    try {
      // Generate random IDs if not provided
      if (!ids) {
        ids = documents.map(() => Math.random().toString(36).substring(2, 15));
      }
      
      await this.makeRequest(`/collections/${collectionName}/add`, 'POST', {
        ids,
        documents,
        metadatas,
      });
      
      toast.success(`${documents.length} documents added to "${collectionName}"`);
    } catch (error) {
      console.error("Error adding documents:", error);
      throw error;
    }
  }
  
  /**
   * Query a collection
   */
  async queryCollection(
    collectionName: string,
    queryTexts: string[],
    nResults: number = 5
  ): Promise<QueryResult> {
    try {
      const response = await this.makeRequest(`/collections/${collectionName}/query`, 'POST', {
        query_texts: queryTexts,
        n_results: nResults,
      });
      
      return response;
    } catch (error) {
      console.error("Error querying collection:", error);
      throw error;
    }
  }
  
  /**
   * Get a document by ID
   */
  async getDocument(collectionName: string, documentId: string): Promise<Document> {
    try {
      const response = await this.makeRequest(`/collections/${collectionName}/get/${documentId}`);
      return response;
    } catch (error) {
      console.error(`Error getting document ${documentId}:`, error);
      throw error;
    }
  }
  
  /**
   * Delete a document by ID
   */
  async deleteDocument(collectionName: string, documentId: string): Promise<void> {
    try {
      await this.makeRequest(`/collections/${collectionName}/delete/${documentId}`, 'DELETE');
      toast.success(`Document deleted successfully`);
    } catch (error) {
      console.error(`Error deleting document ${documentId}:`, error);
      throw error;
    }
  }
}

// Export default instance
export const chromaClient = new ChromaClient();
