import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AppService {
  private backendUrl = 'http://localhost:3000';
  // private backendUrl = 'https://assignment3-backend.uw.r.appspot.com/';

  constructor(private http: HttpClient) {}

  searchStocks(query: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.backendUrl}/search?q=${query}`).pipe(
      map((results) =>
        results.map((item) => ({
          symbol: item.symbol,
          description: item.description,
        }))
      )
    );
  }

  fetchStockProfile(symbol: string): Observable<any> {
    return this.http.get(
      `${this.backendUrl}/api/stock/profile?symbol=${symbol}`
    );
  }

  fetchStockQuote(symbol: string): Observable<any> {
    return this.http.get(`${this.backendUrl}/api/stock/quote?symbol=${symbol}`);
  }
  fetchCompanyPeers(symbol: string): Observable<any> {
    return this.http.get(
      `${this.backendUrl}/api/stock/companypeers?symbol=${symbol}`
    );
  }

  fetchCompanyNews(symbol: string): Observable<any> {
    return this.http.get(
      `${this.backendUrl}/api/stock/companynews?symbol=${symbol}`
    );
  }

  fetchInsiderSentiment(symbol: string): Observable<any> {
    return this.http.get(
      `${this.backendUrl}/api/stock/insidersentiment?symbol=${symbol}`
    );
  }
}
