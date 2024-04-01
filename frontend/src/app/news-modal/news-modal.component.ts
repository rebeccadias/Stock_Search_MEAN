import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { faTwitter, faFacebookF } from '@fortawesome/free-brands-svg-icons';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-news-modal',
  templateUrl: './news-modal.component.html',
  styleUrls: ['./news-modal.component.scss'],
})
export class NewsModalComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    library: FaIconLibrary
  ) {
    library.addIcons(faTimes, faTwitter, faFacebookF);
  }
}
