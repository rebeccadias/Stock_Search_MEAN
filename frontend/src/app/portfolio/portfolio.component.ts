import { Component, OnInit } from '@angular/core';
import { AppService } from '../app.services';
import { MatDialog } from '@angular/material/dialog';
import { BuyDialogComponent } from '../buy-dialog/buy-dialog.component';
import { SellDialogComponent } from '../sell-dialog/sell-dialog.component';

@Component({
  selector: 'app-portfolio',
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.scss']
})

export class PortfolioComponent implements OnInit {
  portfolio: any[] = [];
  userBalance: number = 0;
  currentUser: string = 'RebeccaDias'; 
  profile_name: any[] = [];

  constructor(private appService: AppService,
    public dialog: MatDialog,) {}

  ngOnInit() {
    this.loadUserBalance();
    this.loadPortfolio();
  }

  loadUserBalance() {
    this.appService.getUserBalance(this.currentUser).subscribe({
      next: (data) => {
        this.userBalance = data.balance;
      },
      error: (error) => console.error("Error fetching user balance", error)
    });
  }

  loadPortfolio() {
    this.appService.fetchUserPortfolio(this.currentUser).subscribe({
      next: (data) => {
        this.portfolio = data;
        console.log(this.portfolio);
        this.updatePortfolioWithCurrentPrices();
      },
      error: (error) => console.error("Error fetching portfolio", error)
    });
  }

  updatePortfolioWithCurrentPrices() {
    // Assuming each stock item in portfolio has a 'symbol' property
    this.portfolio.forEach(stock => {
      this.appService.fetchStockQuote(stock.symbol).subscribe({
        next: (quote) => {
          stock.currentPrice = quote.c; // Current price
          stock.change = quote.c - stock.price; // Change since purchase
        },
        error: (error) => console.error(`Error fetching price for ${stock.symbol}`, error)
      });
    });
  }

  openBuyDialog(stock: any): void {
    // Open the BuyDialogComponent with the current stock information
    const dialogRef = this.dialog.open(BuyDialogComponent, {
      width: '450px',
      position: { top: '10px' },
      data: {
        ticker: stock.symbol,
        currentPrice: stock.currentPrice,
        moneyInWallet: this.userBalance
      }
    });

    // Handle the dialog close result
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // If result is not undefined, proceed with the buying operation
        const quantityToBuy = result.quantity;
        this.appService.buyStock(
          this.currentUser,
          stock.symbol,
          quantityToBuy,
          stock.currentPrice,
          stock.name // Assuming you have a 'name' field in your stock
        ).subscribe({
          next: (buyResult) => {
            console.log('Stock purchased successfully', buyResult);
            // Update the portfolio and user balance accordingly
            this.loadUserBalance();
            this.loadPortfolio();
          },
          error: (error) => console.error('Error purchasing stock', error)
        });
      }
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
                currentStocktoSell,
                result.quantity,
                result.total
              
              )
              .subscribe({
                next: (sellResult) => {
                  console.log('Stock sold successfully', sellResult);
                  this.loadUserBalance();
                  this.loadPortfolio();
                },
                error: (error) => console.error('Error selling stock', error),
              });
          }
        });
      },
      error: (error) => console.error('Error fetching user balance', error),
    });
  }


  getColorClass(change: number): string {
    if (change > 0) {
      return 'text-success';
    } else if (change < 0) {
      return 'text-danger';
    } else {
      return 'text-dark';
    }
  }
}
