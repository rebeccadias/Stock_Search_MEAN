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
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { SellDialogComponent } from '../sell-dialog/sell-dialog.component';

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
  summaryChart: any;
  mainChart: any;
  hasCachedData: boolean = false;

  chartOptions!: Highcharts.Options;
  SMA_VolchartOptions!: Highcharts.Options;
  recChartOptions!: Highcharts.Options;
  isFavorite: boolean = false;
  tickerExists: boolean = false;

  selectedNewsItem: any;
  errorMessage: string | null = null;
  stockSellMsg: string = '';
  stockBuylMsg: string = '';
  private subscriptions: Subscription = new Subscription();
  ticker: string = '';
  loading: boolean = false;
  quoteInterval: any;

  private quoteSubscription: Subscription | null = null;

  constructor(
    public dialog: MatDialog,
    private activatedRoute: ActivatedRoute,
    private appService: AppService,
    private router: Router
  ) {}

  ngOnInit() {
    this.activatedRoute.params.subscribe((params) => {
      this.ticker = params['ticker'];
      // Before loading new data, check if we have cached data
      const cachedData = this.appService.getLastSearchResult();
      if (this.ticker === ':ticker') {
        this.ticker = cachedData.ticker;
      }

      this.router.navigate(['/search', this.ticker]);
      this.loading = true;
      if (cachedData) {
        this.loading = true;
        // If the cached data matches the current ticker, use it instead of loading new data
        this.hasCachedData = true;
        this.stockProfile = cachedData.profile;
        this.stockQuote = cachedData.quote;
        this.companyPeers = cachedData.peers;
        this.companyNews = cachedData.news;
        this.insidersentiment = cachedData.sentiment;
        this.loading = false;
        this.setupChart(
          cachedData.summaryChart,
          cachedData.ticker,
          this.stockQuote.d
        );
        // this.loadHistoricalData2years(ticker);
        this.setupSMA_VolChart(cachedData.mainChart.results, cachedData.ticker);
        this.showSellBtn(cachedData.ticker);
      } else {
        this.loading = true;
        // If no cached data matches, proceed to load new data
        this.hasCachedData = false;
        this.loadStockDetails(this.ticker);
        // this.loadHistoricalData2years(ticker);
      }
      this.loadHistoricalData2years(this.ticker);
      this.loadCompanyEarningsData(this.ticker);
      this.loadCompanyRecData(this.ticker);
      this.showSellBtn(this.ticker);

      if (this.quoteInterval) {
        this.loading = false;
        clearInterval(this.quoteInterval); // Clear any existing interval
      }
      // Setup periodic refresh for the stock quote
      // this.quoteInterval = setInterval(() => {
      //   this.appService.fetchStockQuote(this.ticker).subscribe((quote) => {
      //     this.stockQuote = quote;
      //   });
      // }, 15000);
    });
    this.checkMarketStatus();
    this.setCurrentDate();
  }

  loadStockDetails(ticker: string) {
    this.loading = true;
    forkJoin({
      profile: this.appService.fetchStockProfile(ticker),
      quote: this.appService.fetchStockQuote(ticker),
      peers: this.appService.fetchCompanyPeers(ticker),
      news: this.appService.fetchCompanyNews(ticker),
      sentiment: this.appService.fetchInsiderSentiment(ticker),
      summaryChart: this.loadHistoricalData(ticker),
      mainChart: this.loadHistoricalData2years(ticker),
    }).subscribe(
      ({ profile, quote, peers, news, sentiment, summaryChart, mainChart }) => {
        if (Object.keys(profile).length === 0) {
          this.loading = false;
          this.errorMessage = 'No data found. Please enter a valid ticker.';
        } else {
          this.errorMessage = null;
          // Update component state with new data
          this.stockProfile = profile;
          this.stockQuote = quote;
          this.companyPeers = peers;
          this.companyNews = news;
          this.insidersentiment = sentiment;
          this.summaryChart = summaryChart;
          this.mainChart = mainChart;

          // Cache the new data
          this.appService.cacheLastSearchResult({
            ticker: ticker,
            profile: profile,
            quote: quote,
            peers: peers,
            news: news,
            sentiment: sentiment,
            summaryChart: summaryChart,
            mainChart: mainChart,
          });
          // Introduce a 3-second delay before calling setupChart
          this.loading = false;
          setTimeout(() => {
            this.setupChart(this.summaryChart, ticker, this.stockQuote.d);
          }, 1000); // 1000 milliseconds = 1 seconds
          // console.log(this.mainChart, ticker);
          setTimeout(() => {
            this.setupSMA_VolChart(this.mainChart.results, ticker);
          }, 5000);
          // 1000 milliseconds = 1 seconds
        }
      }
    );
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

    // Hardcoded time to 13:00:00 PDT
    const hours = '13';
    const minutes = '00';
    const seconds = '00';

    // Combine date and time in YYYY-MM-DD HH:MM:SS format
    this.currentDate = `${formattedDate} ${hours}:${minutes}:${seconds}`;
  }
  //chatgpt prompt : how to convert a unix timestamp to a human-readable date in typescript
  convertTimestamp(unixTimestamp: number): string {
    const date = new Date(unixTimestamp * 1000); // Convert Unix timestamp to milliseconds

    // Extract date components
    const year = date.getUTCFullYear();
    const month = this.padZero(date.getUTCMonth() + 1); // Month is zero-based, so add 1
    const day = this.padZero(date.getUTCDate());
    const hours = this.padZero(date.getUTCHours() - 7); // Adjust for Pacific Time Zone (UTC -7)
    const minutes = this.padZero(date.getUTCMinutes());
    const seconds = this.padZero(date.getUTCSeconds());

    // Construct the desired format
    const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    return formattedDate;
  }

  padZero(num: number): string {
    return num < 10 ? '0' + num : num.toString();
  }

  loadHistoricalData(ticker: string) {
    ticker = ticker.toUpperCase();
    const toDate = new Date(); // This will be the end of today
    const to = toDate.toISOString().split('T')[0]; // Format to YYYY-MM-DD

    const fromDate = new Date(toDate.getTime() - 24 * 60 * 60 * 1000); // Set to the start of one day before today
    fromDate.setHours(0, 0, 0, 0);

    const from = fromDate.toISOString().split('T')[0];

    // this.appService.fetchHistoricalData(ticker, from, to).subscribe(
    //   (data) => {
    //     console.log(this.stockQuote,data);
    //     const d = this.stockQuote.d;
    //     this.summaryChart = data;
    //     this.setupChart(data, ticker, d);
    //     return data;
    //   },
    //   (error) => {
    //     console.error('Error fetching historical data:', error);
    //   }
    // );
    return this.appService.fetchHistoricalData(ticker, from, to);
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

    // this.appService.fetchHistoricalData2years(ticker, from, to).subscribe(
    //   (data) => {
    //     this.setupSMA_VolChart(data.results, ticker); // Setup SMA Chart
    //   },
    //   (error) => {
    //     console.error('Error fetching historical 2 year data:', error);
    //   }
    // );
    return this.appService.fetchHistoricalData2years(ticker, from, to);
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

  loadCompanyRecData(ticker: string) {
    ticker = ticker.toUpperCase();
    this.appService.fetchCompanyRecData(ticker).subscribe(
      (data) => {
        console.log('data', data);
        this.setupRecChart(data);
      },
      (error) => {
        console.error('Error fetching historical 2 year data:', error);
      }
    );
  }

  setupChart(data: any, ticker: string, d: number) {
    ticker = ticker.toUpperCase();
    const data_new: number[][] = [];
    for (let i = 0; i < data.results.length; i++) {
      const d = data.results[i];
      data_new.push([d.t, d.c]);
    }
    this.chartOptions = {
      chart: {
        type: 'line',
        backgroundColor: '#f8f8f8',
      },
      xAxis: {
        type: 'datetime',
      },
      title: { text: '' },
      rangeSelector: { enabled: false },
      navigator: { enabled: false },
      legend: { enabled: false },
      subtitle: {
        text: `<b style="color: grey" class="boldedtext" >${ticker} Hourly Price Variation</b>`,
        useHTML: true,
      },
      series: [
        {
          type: 'line',
          name: ticker,
          data: data_new,
          color: d > 0 ? 'green' : 'red',
          tooltip: { valueDecimals: 2 },
        },
      ],
      yAxis: {
        title: { text: null },
        showLastLabel: false,
        labels: {
          align: 'right',
          y: -2,
          x: 0,
          style: { fontSize: 'x-small' },
        },
        opposite: true,
      },
      plotOptions: {
        series: {
          marker: {
            enabled: false, // Disable markers for all series
          },
        },
      },
      exporting: { enabled: false },
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
                  this.stockBuylMsg = `${this.stockProfile.ticker} bought successfully`;
                  this.tickerExists = true;
                  // Auto-close the alert after 5 seconds
                  setTimeout(() => {
                    this.stockBuylMsg = '';
                  }, 3000);
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

  openSellDialog(
    currentStocktoSell: string,
    currentPriceofStockToSell: number
  ): void {
    this.appService.getUserBalance(this.currentUser).subscribe({
      next: (res) => {
        const balance = res.balance;
        const dialogRef = this.dialog.open(SellDialogComponent, {
          width: '450px',
          position: { top: '10px' },
          data: {
            ticker: currentStocktoSell,
            currentPriceofStockToSell,
            moneyInWallet: balance,
          },
        });

        // Assuming you want to sell stocks when the dialog is closed and the user confirms the action
        dialogRef.afterClosed().subscribe((result) => {
          if (result) {
            // Call the sellStock method in your AppService to sell the stocks
            this.appService
              .sellStock(
                this.currentUser,
                this.stockProfile.ticker,
                result.quantity,
                result.total
              )
              .subscribe({
                next: (sellResult) => {
                  console.log('Stock sold successfully', sellResult);
                  this.stockSellMsg = `${currentStocktoSell} sold successfully`;
                  // Auto-close the alert after 5 seconds
                  setTimeout(() => {
                    this.stockSellMsg = '';
                  }, 3000);
                },
                error: (error) => console.error('Error selling stock', error),
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
    this.isFavorite = !this.isFavorite;
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
        this.stockBuylMsg = `${watchlistedStockProfile.ticker} added to Watchlist.`;
        // Auto-close the alert after 5 seconds
        setTimeout(() => {
          this.stockBuylMsg = '';
        }, 3000);
      },
      error: (error) => {
        console.error('Error adding stock to favorites:', error);
      },
    });
  }

  openNewsModal(news: any) {
    const formattedDate = new Date(news.datetime * 1000).toLocaleDateString(
      'en-US',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }
    );
    console.log('formattedDate', formattedDate);
    this.dialog.open(NewsModalComponent, {
      width: '450px',
      position: { top: '10px' },
      data: {
        news: news,
        formattedDate: formattedDate,
      },
    });
  }

  setupSMA_VolChart(data: any, ticker: string) {
    const ohlc = [];
    const volume = [];
    ticker = ticker.toUpperCase();

    const groupingUnits: [string, number[]][] = [
      [
        'week', // unit name
        [1], // allowed multiples
      ],
      ['month', [1, 2, 3, 4, 6]],
    ];

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
      rangeSelector: {
        inputEnabled: true,
        enabled: true,
        buttons: [
          {
            type: 'month',
            count: 1,
            text: '1m',
          },
          {
            type: 'month',
            count: 3,
            text: '3m',
          },
          {
            type: 'month',
            count: 6,
            text: '6m',
          },
          {
            type: 'ytd',
            text: 'YTD',
          },
          {
            type: 'year',
            count: 1,
            text: '1y',
          },
          {
            type: 'all',

            text: 'All',
          },
        ],
        selected: 2,
      },
      navigator: {
        enabled: true, // Disable the navigator
      },
      scrollbar: {
        enabled: true, // Disable the scrollbar
      },
      title: { text: `${ticker} Historical` },
      subtitle: {
        text: 'With SMA and Volume by Price technical indicators',
      },
      xAxis: {
        type: 'datetime',
      },
      yAxis: [
        {
          labels: { align: 'right', x: -3 },
          title: { text: 'OHLC' },
          height: '55%',
          lineWidth: 2,
          resize: { enabled: true },
          startOnTick: false,
          endOnTick: false,
          opposite: true, // Move this axis to the right side
        },
        {
          labels: { align: 'right', x: -3 },
          title: { text: 'Volume' },
          top: '65%',
          height: '35%',
          offset: 0,
          lineWidth: 2,
          opposite: true, // Move this axis to the right side
        },
      ],

      tooltip: { split: true },
      plotOptions: {
        series: {
          dataGrouping: {
            units: groupingUnits,
          },
          showInLegend: false,
        },
      },
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
          const splitvalues = this.x.split('!');
          const date = splitvalues[0];
          const surprise = splitvalues[1];
          // chatgpt prompt : how to add a custom tooltip to a highchart graph , how to add a dot in the graph hover tooltip
          const initialHTML = `<div style="font-size: x-small">${date}</div><br><div style="font-size: x-small">${surprise}</div>`;
          return this.points.reduce(function (modifiedHtml: any, point: any) {
            return (
              modifiedHtml +
              '<br/><div style="color:' +
              point.series.color +
              ';">\u25CF </div>' +
              point.series.name +
              ': <b>' +
              point.y +
              '</b>'
            );
          }, initialHTML);
        },
        valueDecimals: 2,
      },
    };
  }

  setupRecChart(data: any) {
    const dataArray = Array.isArray(data) ? data : Object.values(data);
    console.log('dataArray', dataArray);
    const sb = [];
    const ss = [];
    const sell = [];
    const hold = [];
    const buy = [];
    const period = [];

    for (let i = 0; i < dataArray.length; i++) {
      sb.push(data[i].strongBuy);
      ss.push(data[i].strongSell);
      sell.push(data[i].sell);
      hold.push(data[i].hold);
      buy.push(data[i].buy);
      period.push(data[i].period.slice(0, -3));
    }

    this.recChartOptions = {
      chart: {
        type: 'column',
        backgroundColor: '#f8f8f8',
        style: {
          fontSize: 'small',
        },
      },
      title: {
        text: '<span class="h6 fw-medium" style="font-weight: bold;">Recommendation Trends<span>',
        useHTML: true,
      },
      xAxis: {
        categories: period,
      },
      yAxis: {
        min: 0,
        title: {
          text: '#Analysis',
        },
      },
      series: [
        {
          type: 'column',
          name: 'Strong Buy',
          data: sb,
          color: '#196334',
        },
        {
          type: 'column',
          name: 'Buy',
          data: buy,
          color: '#25af51',
        },
        {
          type: 'column',
          name: 'Hold',
          data: hold,
          color: '#ae7e29',
        },
        {
          type: 'column',
          name: 'Sell',
          data: sell,
          color: '#f15053',
        },
        {
          type: 'column',
          name: 'Strong Sell',
          data: ss,
          color: '#752b2c',
        },
      ],
      legend: {
        verticalAlign: 'bottom',
      },
      plotOptions: {
        column: {
          stacking: 'normal',
          dataLabels: {
            enabled: true,
          },
        },
      },
      exporting: {
        enabled: false,
      },
    };
  }

  routeToPeer(ticker: string) {
    console.log(this.hasCachedData);
    this.mainChart = null;
    this.hasCachedData = true;
    this.router.navigate(['/search', ticker]);
    this.loadStockDetails(ticker);
  }
  showSellBtn(ticker: string): void {
    ticker = ticker.toUpperCase();
    this.appService
      .checkTickerExistsInPortfolio(ticker, 'RebeccaDias')
      .subscribe((exists) => {
        this.tickerExists = exists.exists;
        console.log('this.tickerExists', this.tickerExists);
        if (this.tickerExists) {
          // Ticker exists in the portfolio, show sell button
          console.log(`Ticker ${ticker} is in the portfolio.`);
        } else {
          // Ticker does not exist in the portfolio
          console.log(`Ticker ${ticker} is not in the portfolio.`);
        }
      });
  }
}
