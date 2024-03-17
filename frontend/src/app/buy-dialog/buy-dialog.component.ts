import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDialogRef } from '@angular/material/dialog';


@Component({
  selector: 'app-buy-dialog',
  templateUrl: './buy-dialog.component.html',
  styleUrls: ['./buy-dialog.component.scss']
})
export class BuyDialogComponent {
  currentPrice: number;
  moneyInWallet: number;
  quantity: number = 0;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<BuyDialogComponent>
  ) {
    this.currentPrice = data.currentPrice;
    this.moneyInWallet = data.moneyInWallet;
  }

  get totalCost(): number {
    return this.currentPrice * this.quantity;
  }

  get canBuy(): boolean {
    return this.quantity > 0 && this.totalCost <= this.moneyInWallet;
  }
  closeDialog(): void {
    this.dialogRef.close();
  }
}
