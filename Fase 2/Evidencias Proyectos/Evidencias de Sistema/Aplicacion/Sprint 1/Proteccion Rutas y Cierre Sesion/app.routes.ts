import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
    canActivate: [AuthGuard],
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./auth/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./auth/register/register.page').then( m => m.RegisterPage)
  },
  {
    path: 'pages/trabajadores',
    loadComponent: () => import('./pages/trabajadores/trabajadores.page').then( m => m.TrabajadoresPage),
    canActivate: [AuthGuard],
  },
  {
    path: 'pages/compradores',
    loadComponent: () => import('./pages/compradores/compradores.page').then( m => m.CompradoresPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'pages/cultivos',
    loadComponent: () => import('./pages/cultivos/cultivos.page').then( m => m.CultivosPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'pages/tareas',
    loadComponent: () => import('./pages/tareas/tareas.page').then( m => m.TareasPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'pages/gastos',
    loadComponent: () => import('./pages/gastos/gastos.page').then( m => m.GastosPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'pages/pagos',
    loadComponent: () => import('./pages/pagos/pagos.page').then( m => m.PagosPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'pages/ingresos',
    loadComponent: () => import('./pages/ingresos/ingresos.page').then( m => m.IngresosPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'pages/task-history',
    loadComponent: () => import('./pages/task-history/task-history.page').then( m => m.TaskHistoryPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'pages/cultivo-detail',
    loadComponent: () => import('./pages/cultivo-detail/cultivo-detail.page').then( m => m.CultivoDetailPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'user/profile',
    loadComponent: () => import('./user/profile/profile.page').then( m => m.ProfilePage),
    canActivate: [AuthGuard]
  },
  {
    path: 'user/settings',
    loadComponent: () => import('./user/settings/settings.page').then( m => m.SettingsPage),
    canActivate: [AuthGuard]
  },
  //{
  //  path: 'pages/reports',
  //  loadComponent: () => import('./pages/reports/reports.page').then( m => m.ReportsPage)
  //},
];
