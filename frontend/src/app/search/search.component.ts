// In search.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AppService } from '../app.services';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit {
  stockProfile: any;
  stockQuote: any;

  constructor(
    private activatedRoute: ActivatedRoute,
    private appService: AppService
  ) {}

  ngOnInit() {
    this.activatedRoute.params.subscribe(params => {
      const ticker = params['ticker'];
      this.loadStockDetails(ticker);
    });
  }

  loadStockDetails(ticker: string) {
    this.appService.fetchStockProfile(ticker).subscribe(profile => {
      this.stockProfile = profile;
    });

    this.appService.fetchStockQuote(ticker).subscribe(quote => {
      this.stockQuote = quote;
    });
  }
}
