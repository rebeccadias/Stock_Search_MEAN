import { Component, OnInit } from '@angular/core';
import { AppService } from '../app.services';
import { MatDialog } from '@angular/material/dialog';
import { BuyDialogComponent } from '../buy-dialog/buy-dialog.component';
import { SellDialogComponent } from '../sell-dialog/sell-dialog.component';

@Component({
  selector: 'app-portfolio',
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.scss'],
})
export class PortfolioComponent implements OnInit {
  portfolio: any[] = [];
  userBalance: number = 0;
  currentUser: string = 'RebeccaDias';
  profile_name: any[] = [];
  stockSellMsg: string = '';
  stockBuylMsg: string = '';

  constructor(private appService: AppService, public dialog: MatDialog) {}

  ngOnInit() {
    this.loadUserBalance();
    this.loadPortfolio();
  }

  loadUserBalance() {
    this.appService.getUserBalance(this.currentUser).subscribe({
      next: (data) => {
        this.userBalance = data.balance;
      },
      error: (error) => console.error('Error fetching user balance', error),
    });
  }

  loadPortfolio() {
    this.appService.fetchUserPortfolio(this.currentUser).subscribe({
      next: (data) => {
        this.portfolio = data;
        console.log(this.portfolio);
        this.updatePortfolioWithCurrentPrices();
      },
      error: (error) => console.error('Error fetching portfolio', error),
    });
  }

  updatePortfolioWithCurrentPrices() {
    this.portfolio.forEach((stock) => {
      this.appService.fetchStockQuote(stock.symbol).subscribe({
        next: (quote) => {
          stock.currentPrice = quote.c;
          stock.change = quote.c - stock.price;
        },
        error: (error) =>
          console.error(`Error fetching price for ${stock.symbol}`, error),
      });
    });
  }

  openBuyDialog(stock: any): void {
    const dialogRef = this.dialog.open(BuyDialogComponent, {
      width: '450px',
      position: { top: '10px' },
      data: {
        ticker: stock.symbol,
        currentPrice: stock.currentPrice,
        moneyInWallet: this.userBalance,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const quantityToBuy = result.quantity;
        this.appService
          .buyStock(
            this.currentUser,
            stock.symbol,
            quantityToBuy,
            stock.currentPrice,
            stock.name
          )
          .subscribe({
            next: (buyResult) => {
              console.log('Stock purchased successfully', buyResult);

              this.loadUserBalance();
              this.loadPortfolio();
              this.stockBuylMsg = `${stock.symbol} bought successfully`;

              setTimeout(() => {
                this.stockBuylMsg = '';
              }, 3000);
            },
            error: (error) => console.error('Error purchasing stock', error),
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

        dialogRef.afterClosed().subscribe((result) => {
          if (result) {
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
                  this.stockSellMsg = `${currentStocktoSell} sold successfully`;

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

  getColorClass(change: number): string {
    if (change > 0) {
      return 'text-success up-arrow';
    } else if (change < 0) {
      return 'text-danger down-arrow';
    } else {
      return 'text-dark';
    }
  }
}
