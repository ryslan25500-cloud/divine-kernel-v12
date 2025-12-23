/**
 * 🔬 DIVINE KERNEL V12 - NCBI API Client (Fixed)
 */

import { DNASequence } from '../../dna/sequence.js';

export class NCBIClient {
  private baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  async fetchSequence(accession: string): Promise<DNASequence | null> {
    try {
      const url = `${this.baseUrl}/efetch.fcgi?db=nuccore&id=${accession}&rettype=fasta&retmode=text`;
      
      const response = await fetch(url);
      const text = await response.text();
      
      if (!text || text.includes('Error')) {
        return null;
      }

      const lines = text.split('\n');
      const sequence = lines.slice(1).join('').replace(/\s/g, '');
      
      return new DNASequence(sequence);
    } catch (error) {
      console.error(`NCBI fetch failed: ${error}`);
      return null;
    }
  }

  async search(query: string, maxResults: number = 10): Promise<string[]> {
    try {
      const url = `${this.baseUrl}/esearch.fcgi?db=nuccore&term=${encodeURIComponent(query)}&retmax=${maxResults}&retmode=json`;
      
      const response = await fetch(url);
      const data: any = await response.json();
      
      if (data && data.esearchresult && data.esearchresult.idlist) {
        return data.esearchresult.idlist;
      }
      
      return [];
    } catch (error) {
      console.error(`NCBI search failed: ${error}`);
      return [];
    }
  }
}

export default NCBIClient;
