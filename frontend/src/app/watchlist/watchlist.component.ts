import { Component, OnInit } from '@angular/core';
import { AppService } from '../app.services';

@Component({
  selector: 'app-watchlist',
  templateUrl: './watchlist.component.html',
  styleUrls: ['./watchlist.component.scss'],
})
export class WatchlistComponent implements OnInit {
  watchlistEntries: any[] = [];

  constructor(private appService: AppService) {} // Adjusted to AppService

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
}
