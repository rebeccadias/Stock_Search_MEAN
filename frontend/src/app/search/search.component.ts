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

  chartOptions!: Highcharts.Options;
  SMA_VolchartOptions!: Highcharts.Options;
  recChartOptions!: Highcharts.Options;

  selectedNewsItem: any;
  errorMessage: string | null = null;
  private subscriptions: Subscription = new Subscription();

  private quoteSubscription: Subscription | null = null;

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

      if (this.quoteSubscription) {
        this.quoteSubscription.unsubscribe();
        this.quoteSubscription = null;
      }

      // Setup periodic refresh for the stock quote
      this.quoteSubscription = interval(15000)
        .pipe(switchMap(() => this.appService.fetchStockQuote(ticker)))
        .subscribe((quote) => {
          this.stockQuote = quote;
          // You might need to update the chart or other components that use the stock quote
        });

      this.router.navigate(['/search', ticker]);
      console.log(cachedData);
      if (cachedData) {
        // If the cached data matches the current ticker, use it instead of loading new data
        this.stockProfile = cachedData.profile;
        this.stockQuote = cachedData.quote;
        this.companyPeers = cachedData.peers;
        this.companyNews = cachedData.news;
        this.insidersentiment = cachedData.sentiment;
        this.setupChart(
          cachedData.summaryChart,
          cachedData.ticker,
          this.stockQuote.d
        );
        // this.loadHistoricalData2years(ticker);
        this.setupSMA_VolChart(cachedData.mainChart.results, cachedData.ticker);
        // Note: Ensure these properties are correctly assigned based on your caching structure
      } else {
        // If no cached data matches, proceed to load new data
        this.loadStockDetails(ticker);
        // this.loadHistoricalData2years(ticker);
      }
      // this.loadHistoricalData(ticker, this.stockQuote.d);
      // this.loadHistoricalData(ticker);
      this.loadHistoricalData2years(ticker);
      this.loadCompanyEarningsData(ticker);
      this.loadCompanyRecData(ticker);
    });
    this.checkMarketStatus();
    this.setCurrentDate();
  }

  // loadInitialData(ticker: string) {
  //   // Before loading new data, check if we have cached data
  //   const cachedData = this.appService.getLastSearchResult();
  //   if (ticker === ':ticker') {
  //     ticker = cachedData ? cachedData.ticker : '';
  //   }

  //   this.router.navigate(['/search', ticker]);
  //   console.log(cachedData);
  //   if (cachedData) {
  //     // If the cached data matches the current ticker, use it instead of loading new data
  //     this.setupCachedData(cachedData, ticker);
  //   } else {
  //     // If no cached data matches, proceed to load new data
  //     this.loadStockDetails(ticker);
  //   }
  // }

  // setupCachedData(cachedData: any, ticker: string) {
  //   this.stockProfile = cachedData.profile;
  //   // this.stockQuote = cachedData.quote;
  //   this.companyPeers = cachedData.peers;
  //   this.companyNews = cachedData.news;
  //   this.insidersentiment = cachedData.sentiment;
  //   this.setupChart(cachedData.summaryChart, ticker, this.stockQuote.d);
  // }

  // ngOnDestroy() {
  //   // Unsubscribe to ensure no memory leaks
  //   if (this.quoteSubscription) {
  //     this.quoteSubscription.unsubscribe();
  //   }
  // }

  loadStockDetails(ticker: string) {
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
          console.log(this.summaryChart, ticker, this.stockQuote.d);
          setTimeout(() => {
            this.setupChart(this.summaryChart, ticker, this.stockQuote.d);
          }, 3000); // 1000 milliseconds = 1 seconds
          console.log(this.mainChart, ticker);
          setTimeout(() => {
            this.setupSMA_VolChart(this.mainChart.results, ticker);
          }, 5000); // 1000 milliseconds = 1 seconds
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
                  // Here you can refresh the balance or update the UI accordingly
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
        type: 'column', // Specifies the chart type
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
}
