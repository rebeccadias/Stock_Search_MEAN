import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ChangeDetectorRef,
} from '@angular/core';
import * as Highcharts from 'highcharts/highstock';
import vbp from 'highcharts/indicators/volume-by-price';
import indicators from 'highcharts/indicators/indicators';

// Apply Highcharts modules
indicators(Highcharts);
vbp(Highcharts);

@Component({
  selector: 'app-main-chart',
  templateUrl: './main-chart.component.html',
  styleUrls: ['./main-chart.component.scss'],
})
export class MainChartComponent implements OnInit, OnChanges {
  @Input() chartData: any;
  @Input() ticker: string = '';

  Highcharts: typeof Highcharts = Highcharts;
  SMA_VolchartOptions!: Highcharts.Options;

  constructor(private changeDetectorRef: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (this.chartData && this.ticker) {
      this.setupSMA_VolChart(this.chartData, this.ticker);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('Change', this.chartData, changes['chartData'], this.ticker);
    if (changes['chartData'] && this.chartData) {
      this.setupSMA_VolChart(this.chartData, this.ticker);
    }
    this.changeDetectorRef.detectChanges();
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
}
