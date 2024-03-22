import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AppService {
  private backendUrl = 'http://localhost:3000';
  // private backendUrl = 'https://assignment3-backend.uw.r.appspot.com/';
  private lastSearchResult: any = null;

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

  fetchHistoricalData(
    symbol: string,
    from: string,
    to: string
  ): Observable<any> {
    return this.http.get(`${this.backendUrl}/api/stock/historical`, {
      params: { symbol, from, to },
    });
  }

  fetchHistoricalData2years(
    symbol: string,
    from: string,
    to: string
  ): Observable<any> {
    return this.http.get(`${this.backendUrl}/api/stock/historical2years`, {
      params: { symbol, from, to },
    });
  }

  // In app.service.ts

  getUserBalance(name: string): Observable<any> {
    return this.http.get(`${this.backendUrl}/api/user/wallet`, {
      params: { name },
    });
  }

  buyStock(
    name: string,
    symbol: string,
    quantity: number,
    price: number,
    tickername: string,
  ): Observable<any> {
    return this.http.post(`${this.backendUrl}/api/user/buy`, {
      name,
      symbol,
      quantity,
      price,
      tickername,
    });
  }

  // In app.service
  postWatclistedStock(watchlistedStockData: any): Observable<any> {
    return this.http.post(
      `${this.backendUrl}/api/user/watchlist`,
      watchlistedStockData
    );
  }
  getWatchlist(): Observable<any[]> {
    return this.http.get<any[]>(`${this.backendUrl}/api/all/watchlist`);
  }

  deleteStockFromWatchlist(ticker: string): Observable<any> {
    return this.http.delete(`${this.backendUrl}/api/watchlist/delete`, {
      params: { ticker },
    });
  }

  fetchUserPortfolio(name: string): Observable<any> {
    return this.http.get(`${this.backendUrl}/api/user/portfolio`, {
      params: { name },
    });
  }

  // Method to cache the search result
  cacheLastSearchResult(result: any): void {
    this.lastSearchResult = result;
  }

  // Method to get the cached result
  getLastSearchResult(): any {
    return this.lastSearchResult;
  }

  // In AppService, add a method to clear the cache
  clearCache(): void {
    this.lastSearchResult = null;
  }

  fetchCompanyEarningsData(symbol: string): Observable<any> {
    return this.http.get(
      `${this.backendUrl}/api/stock/companyearnings`,{params: { symbol }}
    );
  }

}
