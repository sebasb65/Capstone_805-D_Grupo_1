import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';

// Importaciones para el registro de íconos
import { addIcons } from 'ionicons';
import { 
  leafOutline, personAddOutline, personCircleOutline, logOutOutline, 
  personOutline, settingsOutline, statsChartOutline, peopleOutline, 
  storefrontOutline, documentTextOutline, trendingUpOutline, trendingDownOutline,
  cashOutline, timeOutline, businessOutline, leaf, receiptOutline, walletOutline,
  fileTrayOutline, add, trashOutline, pencilOutline, archiveOutline, barChartOutline, albumsOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {
    this.initializeApp();
    this.registerIcons(); // Llama al nuevo método de registro
  }

  initializeApp() {
    this.authService.authState$.subscribe(user => {
      const targetUrl = user ? '/home' : '/auth/login';
      if (this.router.url !== targetUrl) {
        this.router.navigateByUrl(targetUrl, { replaceUrl: true });
      }
    });
  }

  // Nuevo método para registrar todos los íconos de la app
  registerIcons() {
    addIcons({
      leafOutline,
      personAddOutline,
      personCircleOutline,
      logOutOutline,
      personOutline,
      settingsOutline,
      statsChartOutline,
      peopleOutline,
      storefrontOutline,
      documentTextOutline,
      trendingUpOutline,
      trendingDownOutline,
      cashOutline,
      timeOutline,
      businessOutline,
      leaf,
      receiptOutline,
      walletOutline,
      fileTrayOutline,
      add,
      trashOutline,
      pencilOutline,
      archiveOutline,
      barChartOutline,
      albumsOutline
    });
  }
}
