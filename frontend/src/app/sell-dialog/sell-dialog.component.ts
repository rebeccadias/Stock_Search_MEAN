import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AppService } from '../app.services';

@Component({
  selector: 'app-sell-dialog',
  templateUrl: './sell-dialog.component.html',
  styleUrls: ['./sell-dialog.component.scss'],
})
export class SellDialogComponent implements OnInit {
  currentPriceofStockToSell: number;
  moneyInWallet: number;
  quantity: number = 0;
  numberOfStocks: number = 0;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<SellDialogComponent>,
    private appService: AppService
  ) {
    this.currentPriceofStockToSell = data.currentPriceofStockToSell;
    this.moneyInWallet = data.moneyInWallet;
  }

  ngOnInit(): void {
    this.fetchNumberOfStocks();
  }

  fetchNumberOfStocks(): void {
    this.appService
      .getNumberOfStocks(this.data.ticker, 'RebeccaDias')
      .subscribe(
        (response: any) => {
          this.numberOfStocks = response.quantity;
          console.log('Number of stocks:', this.numberOfStocks);
        },
        (error) => {
          console.error('Error fetching number of stocks:', error);
        }
      );
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  get canBuy(): boolean {
    return this.quantity > this.numberOfStocks;
  }
  get totalCost(): number {
    return this.currentPriceofStockToSell * this.quantity;
  }
}
