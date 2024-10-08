import { NgModule } from '@angular/core';
import {
  BrowserModule,
  provideClientHydration,
} from '@angular/platform-browser';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { SearchComponent } from './search/search.component';
import { WatchlistComponent } from './watchlist/watchlist.component';
import { PortfolioComponent } from './portfolio/portfolio.component';
import { HttpClientModule } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { ReactiveFormsModule, FormsModule } from '@angular/forms'; // Import FormsModule and ReactiveFormsModule
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatAutocompleteModule } from '@angular/material/autocomplete'; // Import MatAutocompleteModule
import { MatInputModule } from '@angular/material/input'; // Import MatInputModule
import { AppService } from './app.services';
import { SearchBarComponent } from './search-bar/search-bar.component';
import { MatTabsModule } from '@angular/material/tabs';
import { HighchartsChartModule } from 'highcharts-angular';
import { BuyDialogComponent } from './buy-dialog/buy-dialog.component';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NewsModalComponent } from './news-modal/news-modal.component';
import { SellDialogComponent } from './sell-dialog/sell-dialog.component';
import { SummaryChartComponent } from './summary-chart/summary-chart.component';
import { MainChartComponent } from './main-chart/main-chart.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    SearchComponent,
    WatchlistComponent,
    PortfolioComponent,
    SearchBarComponent,
    BuyDialogComponent,
    NewsModalComponent,
    SellDialogComponent,
    SummaryChartComponent,
    MainChartComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatInputModule,
    MatTabsModule,
    HighchartsChartModule,
    MatDialogModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    FontAwesomeModule,
  ],
  providers: [provideClientHydration(), provideAnimationsAsync(), AppService],
  bootstrap: [AppComponent],
})
export class AppModule {}
