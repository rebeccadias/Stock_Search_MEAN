// In search.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AppService } from '../app.services';
import { forkJoin } from 'rxjs';
import * as Highcharts from 'highcharts';
import { MatDialog } from '@angular/material/dialog';
import { BuyDialogComponent } from '../buy-dialog/buy-dialog.component';

import { NewsModalComponent } from '../news-modal/news-modal.component';
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
  Highcharts: typeof Highcharts = Highcharts;

  chartOptions!: Highcharts.Options;
  selectedNewsItem: any;

  constructor(
    public dialog: MatDialog,
    private activatedRoute: ActivatedRoute,
    private appService: AppService
  ) {}

  ngOnInit() {
    this.activatedRoute.params.subscribe((params) => {
      const ticker = params['ticker'];
      this.loadStockDetails(ticker);
      this.loadHistoricalData(ticker);
    });
    this.checkMarketStatus();
    this.setCurrentDate();
  }

  loadStockDetails(ticker: string) {
    this.appService.fetchStockProfile(ticker).subscribe((profile) => {
      this.stockProfile = profile;
    });

    this.appService.fetchStockQuote(ticker).subscribe((quote) => {
      this.stockQuote = quote;
      // this.checkMarketStatus();
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
        // console.log('insidersentiment', this.insidersentiment);
      });
  }

  // checkMarketStatus() {
  //   // Safety check to ensure stockQuote is defined
  //   if (!this.stockQuote || !this.stockQuote.t) {
  //     // Handle scenario where stockQuote or stockQuote.t is not yet available
  //     console.log('stockQuote or stockQuote.t is undefined');
  //     return;
  //   }
  //   console.log('stockQuote.t', this.stockQuote.t);

  //   // Convert stockQuote.t to milliseconds to create a Date object
  //   const lastUpdateTimestamp = this.stockQuote.t * 1000;

  //   const lastUpdateDate = new Date(lastUpdateTimestamp);

  //   // Extract hours and minutes from the last update timestamp
  //   const lastUpdateHours = lastUpdateDate.getUTCHours();
  //   const lastUpdateMinutes = lastUpdateDate.getUTCMinutes();

  //   // Get current time in UTC
  //   const currentDate = new Date();
  //   console.log('currentDate', currentDate);
  //   const currentHours = currentDate.getUTCHours();
  //   const currentMinutes = currentDate.getUTCMinutes();

  //   // Calculate the total minutes for easier comparison
  //   const lastUpdateTotalMinutes = lastUpdateHours * 60 + lastUpdateMinutes;
  //   const currentTotalMinutes = currentHours * 60 + currentMinutes;

  //   // Calculate the absolute difference in minutes
  //   const differenceInMinutes = Math.abs(
  //     currentTotalMinutes - lastUpdateTotalMinutes
  //   );

  //   // Market is considered open if the difference is 5 minutes or less
  //   this.isOpen = differenceInMinutes <= 5;

  //   if (!this.isOpen) {
  //     // Market is closed, format the last update timestamp for display
  //     this.currentDate = lastUpdateDate
  //       .toISOString()
  //       .replace('T', ' ')
  //       .slice(0, 19);
  //     console.log(
  //       `Market is closed as of ${this.currentDate}. Stock last updated at ${this.stockQuote.t}`
  //     );
  //   } else {
  //     // Market is open, no need to display the date/time
  //     console.log('Market is open.');
  //   }
  // }

  checkMarketStatus() {
    const now = new Date();
    const utcHour = now.getUTCHours();
    const utcMinute = now.getUTCMinutes();

    // Convert UTC time to Eastern Time (ET)
    const etHour = (utcHour - 4 + 24) % 24; // Adjust for UTC to ET conversion, assuming UTC-4 for ET. Adjust based on daylight saving.

    // Market hours: 9:30 AM to 4:00 PM ET
    this.isOpen =
      (etHour > 9 && etHour < 16) || (etHour === 9 && utcMinute >= 30);
    console.log('Market isOpen:', this.isOpen);
  }

  setCurrentDate() {
    const now = new Date();
    // Format date as YYYY-MM-DD
    const formattedDate = now.toISOString().split('T')[0];

    // Extract hours, minutes, and seconds for HH:MM:SS format
    let hours = now.getHours().toString();
    let minutes = now.getMinutes().toString();
    let seconds = now.getSeconds().toString();

    // Ensure hours, minutes, and seconds are always two digits
    hours = hours.padStart(2, '0');
    minutes = minutes.padStart(2, '0');
    seconds = seconds.padStart(2, '0');

    // Combine date and time in YYYY-MM-DD HH:MM:SS format
    this.currentDate = `${formattedDate} ${hours}:${minutes}:${seconds}`;
  }

  convertTimestamp(timestamp: number): string {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000); // Assuming timestamp is in seconds
    return date.toISOString().replace('T', ' ').slice(0, 19);
  }

  // loadHistoricalData(ticker: string) {
  //   this.stockProfile.ticker = ticker; // Assuming this is where you store the fetched ticker symbol
  //   const toDate = new Date();
  //   const fromDate = new Date(toDate.getFullYear(), toDate.getMonth() - 6, toDate.getDate()); // 6 months ago

  //   const to = toDate.toISOString().split('T')[0];
  //   const from = fromDate.toISOString().split('T')[0];

  //   this.appService.fetchHistoricalData(ticker, from, to).subscribe(data => {
  //     this.setupChart(data, ticker);
  //   }, error => {
  //     console.error('Error fetching historical data:', error);
  //   });
  // }

  loadHistoricalData(ticker: string) {
    // this.stockProfile.ticker = ticker;
    const toDate = new Date(); // This can be any day you choose
    toDate.setHours(23, 59, 59, 999); // Set to the end of the day

    const fromDate = new Date(toDate);
    fromDate.setHours(0, 0, 0, 0); // Set to the start of the same day

    const to = toDate.toISOString().split('T')[0];
    const from = fromDate.toISOString().split('T')[0];

    this.appService.fetchHistoricalData(ticker, from, to).subscribe(
      (data) => {
        // console.error(' fetching historical data:', data);
        this.setupChart(data, ticker);
      },
      (error) => {
        console.error('Error fetching historical data:', error);
      }
    );
  }

  setupChart(data: any, ticker: string) {
    const lineColor = this.stockQuote.d < 0 ? 'red' : 'green';
    // console.log(data);
    this.chartOptions = {
      series: [
        {
          type: 'line',
          data: data.results.map((d: { t: number; c: number }) => [
            d.t * 1000,
            d.c,
          ]),
          color: lineColor, // Set color based on condition
        },
      ],
      title: {
        text: `${this.stockProfile.ticker} Hourly Price Variation`, // Dynamic title
      },
      xAxis: {
        type: 'datetime',
        dateTimeLabelFormats: {
          // Display only the hour
          hour: '%H:%M',
        },
        tickInterval: 3600 * 1000, // Hourly intervals
      },
      yAxis: {
        title: {
          text: 'Price',
        },
        opposite: true, // Move Y-axis to the right
      },
    };
  }

  // Part of SearchComponent

  currentUser: string = 'RebeccaDias'; // Example user name, replace with actual user data

  openBuyDialog(currentPrice: number): void {
    this.appService.getUserBalance(this.currentUser).subscribe({
      next: (res) => {
        const balance = res.balance;
        const dialogRef = this.dialog.open(BuyDialogComponent, {
          width: '450px',
          position: { top: '10px' },
          data: {
            ticker: this.stockProfile.ticker,
            currentPrice,
            moneyInWallet: balance,
          },
        });

        dialogRef.afterClosed().subscribe((result) => {
          if (result) {
            this.appService
              .buyStock(
                this.currentUser,
                this.stockProfile.ticker,
                result.quantity,
                currentPrice
              )
              .subscribe({
                next: (buyResult) => {
                  console.log('Stock purchased successfully', buyResult);
                  // Here you can refresh the balance or update the UI accordingly
                },
                error: (error) =>
                  console.error('Error purchasing stock', error),
              });
          }
        });
      },
      error: (error) => console.error('Error fetching user balance', error),
    });
  }

  toggleFavorite(
    watchlistedStockProfile: any,
    watchlistedstockQuote: any
  ): void {
    const stockData = {
      wticker: watchlistedStockProfile.ticker,
      wname: watchlistedStockProfile.name,
      wprice: watchlistedstockQuote.c,
      wchange: watchlistedstockQuote.d,
      wchangePercent: watchlistedstockQuote.dp,
    };

    this.appService.postWatclistedStock(stockData).subscribe({
      next: (response) => {
        console.log('Stock added to favorites:', response);
        // Optionally, refresh the watchlist or update UI accordingly
      },
      error: (error) => {
        console.error('Error adding stock to favorites:', error);
      },
    });
  }

  openNewsModal(news: any) {
    console.log('news', news);
    this.dialog.open(NewsModalComponent, {
      width: '450px',
      position: { top: '10px' },
      data: {
        news: news,
      },
    });
  }
}
