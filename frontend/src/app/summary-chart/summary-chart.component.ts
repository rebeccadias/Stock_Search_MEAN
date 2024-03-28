import { Component, OnDestroy, Input, OnInit } from '@angular/core';
import * as Highcharts from 'highcharts';
import HC_exporting from 'highcharts/modules/exporting';

HC_exporting(Highcharts);

@Component({
  selector: 'app-summary-chart',
  templateUrl: './summary-chart.component.html',
  styleUrls: ['./summary-chart.component.scss']
})
export class SummaryChartComponent implements OnInit {
  @Input() chartOptions!: Highcharts.Options;
  Highcharts: typeof Highcharts = Highcharts;
  chart!: Highcharts.Chart;

  constructor() { }

  ngOnInit(): void {
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }
}
