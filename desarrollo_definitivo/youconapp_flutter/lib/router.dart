import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'features/tareas/presentation/labores_list_page.dart';
import 'features/tareas/presentation/labor_form_page.dart';
import 'features/auth/presentation/login_page.dart';
import 'features/dashboard/presentation/dashboard_page.dart';
import 'features/auth/data/auth_repo.dart';
import 'features/auth/presentation/register_page.dart';
import 'features/auth/presentation/reset_password_page.dart';


final routerProvider = Provider<GoRouter>((ref) {
  final navigatorKey = GlobalKey<NavigatorState>();
  late final GoRouter _router;

  _router = GoRouter(
    navigatorKey: navigatorKey,
    initialLocation: '/',
    routes: [
      GoRoute(path: '/login', builder: (_, __) => const LoginPage()),
      GoRoute(path: '/register', builder: (_, __) => const RegisterPage()),     
      GoRoute(path: '/reset', builder: (_, __) => const ResetPasswordPage()),  
      GoRoute(path: '/', builder: (_, __) => const DashboardPage()),
      GoRoute(path: '/labores', builder: (_, __) => const LaboresListPage(),),
      GoRoute(path: '/labores/new', builder: (_, __) => const LaborFormPage(),),
      GoRoute(path: '/labores/:id', builder: (ctx, st) => LaborFormPage(id: st.pathParameters['id']),),
    ],
    redirect: (context, state) {
    final isLoggedIn = ref.read(isLoggedInProvider);


    final isPublic = {
      '/login',
      '/register',
      '/reset',
    }.contains(state.matchedLocation);

    if (!isLoggedIn && !isPublic) {
      return '/login';
    }
    if (isLoggedIn && isPublic) {
      // Si ya está logueado, no tiene sentido estar en páginas públicas
      return '/';
    }
    return null;
  },

  );

  // Cuando cambie el estado de autenticación, forzamos reevaluar redirect:
  ref.listen(authStateChangesProvider, (_, __) {
    _router.refresh();
  });

  return _router;
});
