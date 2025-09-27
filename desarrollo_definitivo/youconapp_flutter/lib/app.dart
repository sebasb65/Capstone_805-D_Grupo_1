import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'router.dart';

class YouConApp extends ConsumerWidget {
  const YouConApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final goRouter = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'YouConApp',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF0B5DBB)),
        useMaterial3: true,
      ),
      routerConfig: goRouter,
    );
  }
}
//soy un comentario para ver si se muestra la actividad aqui, pero necesito saber como probamos que vaya funcionando, 
//ya que en la consola de vs code uno escribe flutter run y ve como va el proyecto de manera local, asi que a investigar...
