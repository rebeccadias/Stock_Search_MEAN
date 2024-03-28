import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-buy-dialog',
  templateUrl: './buy-dialog.component.html',
  styleUrls: ['./buy-dialog.component.scss'],
})
export class BuyDialogComponent {
  currentPrice: number;
  moneyInWallet: number;
  quantity: number = 0;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<BuyDialogComponent>
  ) {
    this.currentPrice = Number(data.currentPrice.toFixed(2));
    this.moneyInWallet = Number(data.moneyInWallet.toFixed(2));
  }

  get totalCost(): number {
    const total = this.currentPrice * this.quantity;
    return Number(total.toFixed(2)); // Round to 2 decimals
  }

  get canBuy(): boolean {
    return this.totalCost > this.moneyInWallet;
  }
  closeDialog(): void {
    this.dialogRef.close();
  }
}
