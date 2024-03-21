import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-news-modal',
  templateUrl: './news-modal.component.html',
  styleUrl: './news-modal.component.scss'
})
export class NewsModalComponent { 
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}

}
