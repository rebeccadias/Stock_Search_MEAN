// In search.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AppService } from '../app.services';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
})
export class SearchComponent implements OnInit {
  stockProfile: any;
  stockQuote: any;
  companyPeers: any;
  companyNews: any;
  insidersentiment: any;
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
  }

  loadStockDetails(ticker: string) {
    this.appService.fetchStockProfile(ticker).subscribe((profile) => {
      this.stockProfile = profile;
    });

    this.appService.fetchStockQuote(ticker).subscribe((quote) => {
      this.stockQuote = quote;
      this.checkMarketStatus();
    });
    this.appService.fetchCompanyPeers(ticker).subscribe((companypeers) => {
      this.companyPeers = companypeers;
    });
    this.appService.fetchCompanyNews(ticker).subscribe((companynews) => {
      this.companyNews = companynews;
    });
    this.appService
      .fetchInsiderSentiment(ticker)
      .subscribe((insidersentiment) => {
        this.insidersentiment = insidersentiment;
        console.log('insidersentiment', this.insidersentiment);
      });
  }

  checkMarketStatus() {
    // Safety check to ensure stockQuote is defined
    if (!this.stockQuote || !this.stockQuote.t) {
      // Handle scenario where stockQuote or stockQuote.t is not yet available
      console.log('stockQuote or stockQuote.t is undefined');
      return;
    }
    console.log('stockQuote.t', this.stockQuote.t);

    // Convert stockQuote.t to milliseconds to create a Date object
    const lastUpdateTimestamp = this.stockQuote.t * 1000;

    const lastUpdateDate = new Date(lastUpdateTimestamp);

    // Extract hours and minutes from the last update timestamp
    const lastUpdateHours = lastUpdateDate.getUTCHours();
    const lastUpdateMinutes = lastUpdateDate.getUTCMinutes();

    // Get current time in UTC
    const currentDate = new Date();
    console.log('currentDate', currentDate);
    const currentHours = currentDate.getUTCHours();
    const currentMinutes = currentDate.getUTCMinutes();

    // Calculate the total minutes for easier comparison
    const lastUpdateTotalMinutes = lastUpdateHours * 60 + lastUpdateMinutes;
    const currentTotalMinutes = currentHours * 60 + currentMinutes;

    // Calculate the absolute difference in minutes
    const differenceInMinutes = Math.abs(
      currentTotalMinutes - lastUpdateTotalMinutes
    );

    // Market is considered open if the difference is 5 minutes or less
    this.isOpen = differenceInMinutes <= 5;

    if (!this.isOpen) {
      // Market is closed, format the last update timestamp for display
      this.currentDate = lastUpdateDate
        .toISOString()
        .replace('T', ' ')
        .slice(0, 19);
      console.log(
        `Market is closed as of ${this.currentDate}. Stock last updated at ${this.stockQuote.t}`
      );
    } else {
      // Market is open, no need to display the date/time
      console.log('Market is open.');
    }
  }

  convertTimestamp(timestamp: number): string {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000); // Assuming timestamp is in seconds
    return date.toISOString().replace('T', ' ').slice(0, 19);
  }
  
}
