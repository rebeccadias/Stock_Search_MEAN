import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'frontend';
  isActiveSearch: boolean = false;

  constructor(private router: Router) {}

  ngOnInit() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        // Check if the current URL is either /home or matches /search/something
        this.isActiveSearch =
          event.urlAfterRedirects === '/search/home' ||
          event.urlAfterRedirects.startsWith('/search/');
      }
    });
  }
}
