import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable, of } from 'rxjs';
import {
  map,
  startWith,
  debounceTime,
  switchMap,
  filter,
  tap,
} from 'rxjs/operators';
import { AppService } from '../app.services';
import { Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.scss',
})
export class SearchBarComponent {
  myControl = new FormControl();
  options: string[] = [];

  isSpinning = false;
  filteredOptions:
    | Observable<{ symbol: string; description: string }[]>
    | undefined;

  constructor(private appService: AppService, private router: Router) {}

  ngOnInit() {
    this.filteredOptions = this.myControl.valueChanges.pipe(
      debounceTime(300),
      tap(() => (this.isSpinning = true)),
      switchMap((value) => this._filter(value || '')),
      tap(() => (this.isSpinning = false))
    );
    // this.myControl.valueChanges.subscribe(value => {
    //   console.log("Value changes:", value);
    // });
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        // Reset myControl or its value here if needed
        Example: this.myControl.setValue('');
      });
  }

  // Assume searchStocks returns Observable<any[]>, where each item has at least symbol and description properties
  private _filter(value: any): Observable<any[]> {
    let searchString = value;
    if (typeof value === 'object' && value !== null) {
      searchString = value.symbol; // Use the symbol if the value is an object
    }

    if (!searchString.trim()) {
      this.isSpinning = false;
      return of([]);
    }

    return this.appService
      .searchStocks(searchString.trim())
      .pipe(map((response) => response));
  }

  performSearch() {
    let tickerValue = this.myControl.value;
    // Check if the value is an object and has a symbol property
    if (
      typeof tickerValue === 'object' &&
      tickerValue !== null &&
      tickerValue.symbol
    ) {
      tickerValue = tickerValue.symbol;
    } else if (typeof tickerValue === 'string') {
      // If it's a string, use the part before the '|' character
      tickerValue = tickerValue.split('|')[0].trim();
    }

    if (tickerValue) {
      this.router.navigate(['/search', tickerValue]);
    }
  }

  // In your component
  displayFn(stock: any): string {
    return stock && stock.symbol
      ? `${stock.symbol} | ${stock.description}`
      : '';
  }

  clearInput() {
    this.myControl.setValue('');
  }
}
