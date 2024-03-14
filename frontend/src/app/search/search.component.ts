// In search.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AppService } from '../app.services';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
})
export class SearchComponent implements OnInit {
  stockProfile: any;
  stockQuote: any;
  isOpen: boolean = false;
  currentDate: string = '';

  constructor(
    private activatedRoute: ActivatedRoute,
    private appService: AppService
  ) {}

  ngOnInit() {
    this.activatedRoute.params.subscribe((params) => {
      const ticker = params['ticker'];
      this.loadStockDetails(ticker);
    });
    this.checkMarketStatus();
  }

  loadStockDetails(ticker: string) {
    this.appService.fetchStockProfile(ticker).subscribe((profile) => {
      this.stockProfile = profile;
    });

    this.appService.fetchStockQuote(ticker).subscribe((quote) => {
      this.stockQuote = quote;
    });
  }
  checkMarketStatus() {
    const currentDateTimeUTC = new Date(); // This is actually in UTC
    const edtOffset = 4 * 60; // EDT is UTC-4 hours, but JavaScript offset is positive for behind UTC

    // Assuming you're adjusting for EDT (Eastern Daylight Time, UTC-4)
    // Note: This simplistic approach doesn't handle daylight saving time changes.
    const edtTime = new Date(currentDateTimeUTC.getTime() - edtOffset * 60000);

    // Set market hours in EDT
    const marketOpen = new Date(edtTime);
    marketOpen.setHours(9, 30, 0); // Market opens at 9:30 AM EDT
    const marketClose = new Date(edtTime);
    marketClose.setHours(16, 0, 0); // Market closes at 4:00 PM EDT

    // Check if current EDT time is within market hours
    this.isOpen = edtTime >= marketOpen && edtTime <= marketClose;

    // Format current date and time for display (consider timezone adjustments if needed)
    this.currentDate = edtTime.toISOString().replace('T', ' ').slice(0, 19);
  }
}
