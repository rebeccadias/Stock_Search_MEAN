// In search.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AppService } from '../app.services';
import { forkJoin } from 'rxjs';
import * as Highcharts from 'highcharts';
import { MatDialog } from '@angular/material/dialog';
import { BuyDialogComponent } from '../buy-dialog/buy-dialog.component';
import { Router, NavigationEnd } from '@angular/router';

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
    private appService: AppService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.activatedRoute.params.subscribe((params) => {
      let ticker = params['ticker'];
      // Before loading new data, check if we have cached data
      const cachedData = this.appService.getLastSearchResult();
      if (ticker === ':ticker'){
        ticker = cachedData.ticker;
      }
      console.log(cachedData,ticker);
      this.router.navigate(['/search', ticker]);
      if(cachedData) {
        // If the cached data matches the current ticker, use it instead of loading new data
        this.stockProfile = cachedData.profile;
        this.stockQuote = cachedData.quote;
        this.companyPeers = cachedData.peers;
        this.companyNews = cachedData.news;
        this.insidersentiment = cachedData.sentiment;
        // Note: Ensure these properties are correctly assigned based on your caching structure
      } else {
        // If no cached data matches, proceed to load new data
        this.loadStockDetails(ticker);
      }
      this.loadHistoricalData(ticker);
    });
    this.checkMarketStatus();
    this.setCurrentDate();
  }

  loadStockDetails(ticker: string) {
    forkJoin({
      profile: this.appService.fetchStockProfile(ticker),
      quote: this.appService.fetchStockQuote(ticker),
      peers: this.appService.fetchCompanyPeers(ticker),
      news: this.appService.fetchCompanyNews(ticker),
      sentiment: this.appService.fetchInsiderSentiment(ticker),
    }).subscribe(({ profile, quote, peers, news, sentiment }) => {
      // Update component state with new data
      this.stockProfile = profile;
      this.stockQuote = quote;
      this.companyPeers = peers;
      this.companyNews = news;
      this.insidersentiment = sentiment;
  
      // Cache the new data
      this.appService.cacheLastSearchResult({
        ticker: ticker,
        profile: profile,
        quote: quote,
        peers: peers,
        news: news,
        sentiment: sentiment,
      });
    });
  }
  
  
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
                currentPrice,
                this.stockProfile.name
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
