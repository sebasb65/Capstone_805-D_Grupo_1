import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/auth_repo.dart';
import 'package:go_router/go_router.dart';
import 'package:firebase_auth/firebase_auth.dart';

class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});
  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  final emailCtrl = TextEditingController();
  final passCtrl  = TextEditingController();
  bool loading = false;
  String? error;

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authRepoProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('YouConApp – Iniciar sesión')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(children: [
          TextField(
            controller: emailCtrl,
            keyboardType: TextInputType.emailAddress,
            decoration: const InputDecoration(labelText: 'Correo'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: passCtrl,
            obscureText: true,
            decoration: const InputDecoration(labelText: 'Contraseña'),
          ),
          if (error != null) Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(error!, style: const TextStyle(color: Colors.red)),
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: loading ? null : () async {
              setState(() { loading = true; error = null; });
              try {
                await auth.signIn(emailCtrl.text, passCtrl.text);
                if (mounted) context.go('/');
              } on FirebaseAuthException catch (e) {
                setState(() => error = e.message ?? 'No se pudo iniciar sesión');
              } finally {
                if (mounted) setState(() => loading = false);
              }
            },
            child: Text(loading ? 'Ingresando…' : 'Ingresar'),
            
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              TextButton(
                onPressed: () => context.push('/register'),
                child: const Text('Crear cuenta'),
              ),
              const SizedBox(width: 8),
              TextButton(
                onPressed: () => context.push('/reset'),
                child: const Text('¿Olvidaste tu contraseña?'),
              ),
            ],
          ),

        ]),
      ),
    );
  }
}
