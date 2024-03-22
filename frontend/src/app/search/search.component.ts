// In search.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AppService } from '../app.services';
import { forkJoin } from 'rxjs';
import * as Highcharts from 'highcharts/highstock';
import { MatDialog } from '@angular/material/dialog';
import { BuyDialogComponent } from '../buy-dialog/buy-dialog.component';
import { Router, NavigationEnd } from '@angular/router';
import { Input } from '@angular/core';

import vbp from 'highcharts/indicators/volume-by-price';
import indicators from 'highcharts/indicators/indicators';

indicators(Highcharts);
vbp(Highcharts);

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
  companyEarningsChartOptions!: Highcharts.Options;
  Highcharts: typeof Highcharts = Highcharts;

  chartOptions!: Highcharts.Options;
  SMA_VolchartOptions!: Highcharts.Options;

  selectedNewsItem: any;

  constructor(
    public dialog: MatDialog,
    private activatedRoute: ActivatedRoute,
    private appService: AppService,
    private router: Router
  ) {}

  ngOnInit() {
    this.activatedRoute.params.subscribe((params) => {
      let ticker = params['ticker'];
      // Before loading new data, check if we have cached data
      const cachedData = this.appService.getLastSearchResult();
      if (ticker === ':ticker') {
        ticker = cachedData.ticker;
      }

      this.router.navigate(['/search', ticker]);
      if (cachedData) {
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
      // this.loadHistoricalData(ticker, this.stockQuote.d);
      this.loadHistoricalData(ticker);
      this.loadHistoricalData2years(ticker);
      this.loadCompanyEarningsData(ticker);
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

  // loadHistoricalData(ticker: string,d: number) {
  //   // this.stockProfile.ticker = ticker;
  //   const toDate = new Date(); // This can be any day you choose
  //   toDate.setHours(23, 59, 59, 999); // Set to the end of the day

  //   const fromDate = new Date(toDate);
  //   fromDate.setHours(0, 0, 0, 0); // Set to the start of the same day

  //   const to = toDate.toISOString().split('T')[0];
  //   const from = fromDate.toISOString().split('T')[0];

  //   this.appService.fetchHistoricalData(ticker, from, to).subscribe(
  //     (data) => {
  //       // console.error(' fetching historical data:', data);
  //       this.setupChart(data, ticker,d);
  //     },
  //     (error) => {
  //       console.error('Error fetching historical data:', error);
  //     }
  //   );
  // }

  loadHistoricalData(ticker: string) {
    ticker = ticker.toUpperCase();
    const toDate = new Date(); // This will be the end of today
    const to = toDate.toISOString().split('T')[0]; // Format to YYYY-MM-DD

    const fromDate = new Date(toDate.getTime() - 24 * 60 * 60 * 1000); // Set to the start of one day before today
    fromDate.setHours(0, 0, 0, 0);

    const from = fromDate.toISOString().split('T')[0];

    this.appService.fetchHistoricalData(ticker, from, to).subscribe(
      (data) => {
        const d = this.stockQuote.d;

        this.setupChart(data, ticker, d);
      },
      (error) => {
        console.error('Error fetching historical data:', error);
      }
    );
  }

  loadHistoricalData2years(ticker: string) {
    ticker = ticker.toUpperCase();
    // Calculate 'to' as today's date
    const toDate = new Date();
    const to = toDate.toISOString().split('T')[0];

    // Calculate 'from' as the date 2 years before today
    const fromDate = new Date(toDate);
    fromDate.setFullYear(fromDate.getFullYear() - 2); // Subtract 2 years
    const from = fromDate.toISOString().split('T')[0]; // Format to YYYY-MM-DD

    this.appService.fetchHistoricalData2years(ticker, from, to).subscribe(
      (data) => {
        this.setupSMA_VolChart(data.results, ticker); // Setup SMA Chart
      },
      (error) => {
        console.error('Error fetching historical 2 year data:', error);
      }
    );
  }

  loadCompanyEarningsData(ticker: string) {
    ticker = ticker.toUpperCase();
    this.appService.fetchCompanyEarningsData(ticker).subscribe(
      (data) => {
        this.setupEarningsChart(data); // Setup Earning Chart
      },
      (error) => {
        console.error('Error fetching historical 2 year data:', error);
      }
    );
  }

  setupChart(data: any, ticker: string, d: number) {
    const lineColor = d < 0 ? 'red' : 'green';

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
        text: `${ticker} Hourly Price Variation`, // Dynamic title
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

  setupSMA_VolChart(data: any, ticker: string) {
    const ohlc = [];
    const volume = [];

    for (let i = 0; i < data.length; i++) {
      const point = data[i];
      ohlc.push([
        point.t, // timestamp in milliseconds
        point.o, // open
        point.h, // high
        point.l, // low
        point.c, // close
      ]);

      volume.push([
        point.t, // timestamp in milliseconds
        point.v, // volume
      ]);
    }

    this.SMA_VolchartOptions = {
      rangeSelector: { selected: 2 },
      title: { text: 'With SMA and Volume by Price technical indicators' },
      yAxis: [
        {
          labels: { align: 'right', x: -3 },
          title: { text: 'OHLC' },
          height: '60%',
          lineWidth: 2,
          resize: { enabled: true },
          startOnTick: false,
          endOnTick: false,
        },
        {
          labels: { align: 'right', x: -3 },
          title: { text: 'Volume' },
          top: '65%',
          height: '35%',
          offset: 0,
          lineWidth: 2,
        },
      ],
      tooltip: { split: true },
      series: [
        {
          type: 'candlestick',
          name: ticker,
          id: ticker.toLowerCase(),
          zIndex: 2,
          data: ohlc,
        },
        {
          type: 'column',
          name: 'Volume',
          id: 'volume',
          data: volume,
          yAxis: 1,
        },
        {
          type: 'vbp',
          linkedTo: ticker.toLowerCase(),
          params: { volumeSeriesID: 'volume' },
          dataLabels: { enabled: false },
          zoneLines: { enabled: false },
        },
        {
          type: 'sma',
          linkedTo: ticker.toLowerCase(),
          zIndex: 1,
          marker: { enabled: false },
        },
      ],
    };
  }
  setupEarningsChart(data: any) {
    // function for drawing line on the graph after the chart has been rendered

    // code for getting X Axis Labels
    const XAxisLAbels = [];

    // for (let i = 0; i < data.length; i++) {
    //   const point = data[i];
    //   XAxisLAbels.push(
    //     `point.period! `Surprise: ${point.surprise}``, // open
    //   );

    // }
    const XAxisLabels = data.map(
      (point: any) => `${point.period}!Surprise: ${point.surprise}`
    );
    // console.log(XAxisLabels);

    //getting min value for estimate and actual

    const estimate = [];
    const actual = [];

    for (let i = 0; i < data.length; i++) {
      estimate.push(data[i].estimate);
      actual.push(data[i].actual);
    }
    const EstimateMin = estimate.reduce(
      (min, e) => Math.min(min, e),
      Number.POSITIVE_INFINITY
    );
    const ActualMin = actual.reduce(
      (min, a) => Math.min(min, a),
      Number.POSITIVE_INFINITY
    );
    const minEvsA = Math.min(EstimateMin, ActualMin);

    this.companyEarningsChartOptions = {
      series: [
        {
          name: 'Actual',
          type: 'spline',
          data: data.reduce((acc: any, curr: any) => {
            acc.push(curr.actual);
            return acc;
          }, []),
          color: '#30b8fd',
        },
        {
          name: 'Estimate',
          type: 'spline',
          data: data.reduce((acc: any, curr: any) => {
            acc.push(curr.estimate);
            return acc;
          }, []),
          color: '#625ac8',
        },
      ],
      title: {
        text: 'Historical EPS Surprises',
      },
      chart: {
        type: 'spline',
        backgroundColor: '#f8f8f8',
        style: {
          fontSize: 'small',
        },
        // events: {
        //   load: function () {
        //     drawCustomLine(this);
        //   },
        // },
      },
      xAxis: {
        categories: XAxisLabels,
        labels: {
          formatter: function (this: any) {
            const splitvalues = this.value.split('!');
            const date = splitvalues[0];
            const surprise = splitvalues[1];
            return `<div>${date}</div><br><div>${surprise}</div>`;
          },
        },
      },
      yAxis: {
        title: {
          text: 'Quarterly EPS',
        },
        min: minEvsA,
        crosshair: false,
      },
      tooltip: {
        shared: true,

        formatter: function (this: any) {
          // console.log('this', this);
          return this.points.reduce(function (s: any, point: any) {
            console.log('point', point);
            console.log('s', s);
            return (
              s +
              '<br/><span style="color:' +
              point.series.color +
              ';">\u25CF </span>' +
              point.series.name +
              ': <b>' +
              point.y +
              '</b>'
            );
          }, '<p style="font-size: x-small">' +
            this.x[0] +
            '<br/>' +
            this.x[1] +
            '</P>');
        },
        valueDecimals: 2,
      },
    };
  }
}
