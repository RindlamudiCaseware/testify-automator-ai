
// ChromaDB Client for vector database operations
import { toast } from "sonner";

// Mock documents storage (in real applications, this would be stored in ChromaDB)
interface MockStorageItem {
  id: string;
  document: string;
  metadata: Record<string, any>;
}

// Mock storage for in-memory document handling
class MockStorage {
  private collections: Map<string, MockStorageItem[]> = new Map();
  
  createCollection(name: string): void {
    if (!this.collections.has(name)) {
      this.collections.set(name, []);
    }
  }
  
  addDocuments(collectionName: string, documents: string[], metadatas: Record<string, any>[]): void {
    if (!this.collections.has(collectionName)) {
      this.createCollection(collectionName);
    }
    
    const collection = this.collections.get(collectionName)!;
    
    for (let i = 0; i < documents.length; i++) {
      const id = Math.random().toString(36).substring(2, 15);
      collection.push({
        id,
        document: documents[i],
        metadata: metadatas[i] || {},
      });
    }
  }
  
  getDocuments(collectionName: string): MockStorageItem[] {
    return this.collections.get(collectionName) || [];
  }
  
  queryCollection(collectionName: string, queryText: string, nResults: number = 5): MockStorageItem[] {
    const collection = this.collections.get(collectionName) || [];
    // This is a simple search implementation
    // In a real system, this would use embeddings and semantic search
    return collection
      .filter(item => item.document.toLowerCase().includes(queryText.toLowerCase()))
      .slice(0, nResults);
  }
  
  deleteDocument(collectionName: string, documentId: string): void {
    const collection = this.collections.get(collectionName);
    if (collection) {
      const index = collection.findIndex(item => item.id === documentId);
      if (index !== -1) {
        collection.splice(index, 1);
      }
    }
  }

  // Add a method to get collection names 
  getCollectionNames(): string[] {
    return Array.from(this.collections.keys());
  }
}

// Create a singleton instance of the mock storage
const mockStorage = new MockStorage();

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
 * ChromaDB client wrapper (mock implementation)
 * In a production environment, this would be replaced with actual API calls to ChromaDB
 */
export class ChromaClient {
  private baseUrl: string = "";
  
  constructor(baseUrl: string = "") {
    this.baseUrl = baseUrl;
    console.log("Created mock ChromaDB client");
  }
  
  /**
   * Set API key for ChromaDB - not needed in mock implementation
   */
  setApiKey(apiKey: string): void {
    // In a mock implementation, we don't need to store the API key
    console.log("API key setting is ignored in mock implementation");
  }
  
  /**
   * List all collections
   */
  async listCollections(): Promise<Collection[]> {
    try {
      // Return the names of collections in the mock storage
      // Use the new method instead of directly accessing the private property
      return mockStorage.getCollectionNames().map(name => ({
        id: name,
        name,
        metadata: {},
      }));
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
      mockStorage.createCollection(name);
      
      toast.success(`Collection "${name}" created successfully`);
      return {
        id: name,
        name,
        metadata,
      };
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
      mockStorage.addDocuments(collectionName, documents, metadatas);
      
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
      const results = queryTexts.map(queryText => 
        mockStorage.queryCollection(collectionName, queryText, nResults)
      );
      
      // Format results to match the expected ChromaDB response format
      return {
        ids: results.map(items => items.map(item => item.id)),
        documents: results.map(items => items.map(item => item.document)),
        metadatas: results.map(items => items.map(item => item.metadata)),
        distances: results.map(items => items.map(() => 0)), // Mock distances
      };
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
      const collection = mockStorage.getDocuments(collectionName);
      const document = collection.find(item => item.id === documentId);
      
      if (!document) {
        throw new Error(`Document ${documentId} not found`);
      }
      
      return document;
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
      mockStorage.deleteDocument(collectionName, documentId);
      toast.success(`Document deleted successfully`);
    } catch (error) {
      console.error(`Error deleting document ${documentId}:`, error);
      throw error;
    }
  }
}

// Export default instance
export const chromaClient = new ChromaClient();
