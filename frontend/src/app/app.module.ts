import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';

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

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    SearchComponent,
    WatchlistComponent,
    PortfolioComponent,
    SearchBarComponent,
    BuyDialogComponent
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
  ],
  providers: [
    provideClientHydration(),
    provideAnimationsAsync(),
    AppService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
