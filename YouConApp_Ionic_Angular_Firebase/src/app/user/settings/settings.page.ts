import { Component, OnInit, Renderer2, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class SettingsPage implements OnInit {

  isDarkMode: boolean = false;
  private renderer = inject(Renderer2);

  constructor() { }

  ngOnInit() {
    // Revisa si hay una preferencia guardada en el almacenamiento local
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
      this.isDarkMode = storedTheme === 'dark';
    } else {
      // Si no, revisa la preferencia del sistema operativo
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
      this.isDarkMode = prefersDark.matches;
    }
    this.updateBodyTheme();
  }

  // Se activa cuando el usuario presiona el interruptor
  onToggleColorTheme(event: any) {
    this.isDarkMode = event.detail.checked;
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
    this.updateBodyTheme();
  }

  // Aplica la clase 'dark' al body del documento
  private updateBodyTheme() {
    if (this.isDarkMode) {
      this.renderer.addClass(document.body, 'dark');
    } else {
      this.renderer.removeClass(document.body, 'dark');
    }
  }
}