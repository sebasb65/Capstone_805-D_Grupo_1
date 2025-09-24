import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/auth_repo.dart';
import 'package:go_router/go_router.dart';
import 'package:firebase_auth/firebase_auth.dart';

class RegisterPage extends ConsumerStatefulWidget {
  const RegisterPage({super.key});
  @override
  ConsumerState<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends ConsumerState<RegisterPage> {
  final emailCtrl = TextEditingController();
  final passCtrl  = TextEditingController();
  final pass2Ctrl = TextEditingController();
  bool loading = false;
  String? error;

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authRepoProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Crear cuenta')),
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
          const SizedBox(height: 12),
          TextField(
            controller: pass2Ctrl,
            obscureText: true,
            decoration: const InputDecoration(labelText: 'Repite la contraseña'),
          ),
          if (error != null) Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(error!, style: const TextStyle(color: Colors.red)),
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: loading ? null : () async {
              setState(() { loading = true; error = null; });
              if (passCtrl.text.trim() != pass2Ctrl.text.trim()) {
                setState(() {
                  loading = false;
                  error = 'Las contraseñas no coinciden';
                });
                return;
              }
              try {
                await auth.signUp(emailCtrl.text, passCtrl.text);
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Cuenta creada. Revisa tu correo para verificarla.')),
                  );
                  context.go('/'); // redirige al dashboard (o al login si prefieres)
                }
              } on FirebaseAuthException catch (e) {
                setState(() => error = e.message ?? 'No se pudo crear la cuenta');
              } finally {
                if (mounted) setState(() => loading = false);
              }
            },
            child: Text(loading ? 'Creando…' : 'Crear cuenta'),
          ),
          const SizedBox(height: 16),
          TextButton(
            onPressed: () => context.go('/login'),
            child: const Text('¿Ya tienes cuenta? Inicia sesión'),
          ),
        ]),
      ),
    );
  }
}
