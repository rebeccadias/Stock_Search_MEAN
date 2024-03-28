import { Component, OnInit } from '@angular/core';
import { AppService } from '../app.services';
import { Router } from '@angular/router';

@Component({
  selector: 'app-watchlist',
  templateUrl: './watchlist.component.html',
  styleUrls: ['./watchlist.component.scss'],
})
export class WatchlistComponent implements OnInit {
  watchlistEntries: any[] = [];

  constructor(private appService: AppService, private router: Router) {} // Adjusted to AppService

  ngOnInit(): void {
    this.appService.getWatchlist().subscribe({
      next: (data: any) => {
        // Consider defining a more specific type instead of any
        this.watchlistEntries = data;
      },
      error: (error: any) => {
        console.error('Error fetching watchlist', error);
      },
    });
  }

  redirectToPage(url: string): void {
    this.appService.clearCache();
    this.router.navigate([url]);
  }

  deleteStock(ticker: string): void {
    this.appService.deleteStockFromWatchlist(ticker).subscribe({
      next: () => {
        // Remove the stock from the local array to update UI
        this.watchlistEntries = this.watchlistEntries.filter(
          (entry) => entry.ticker !== ticker
        );
      },
      error: (error: any) =>
        console.error('Error removing stock from watchlist', error),
    });
  }
}
