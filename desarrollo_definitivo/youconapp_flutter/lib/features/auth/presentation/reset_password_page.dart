import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/auth_repo.dart';
import 'package:go_router/go_router.dart';
import 'package:firebase_auth/firebase_auth.dart';

class ResetPasswordPage extends ConsumerStatefulWidget {
  const ResetPasswordPage({super.key});
  @override
  ConsumerState<ResetPasswordPage> createState() => _ResetPasswordPageState();
}

class _ResetPasswordPageState extends ConsumerState<ResetPasswordPage> {
  final emailCtrl = TextEditingController();
  bool loading = false;
  String? error;
  String? info;

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authRepoProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Recuperar contraseña')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(children: [
          TextField(
            controller: emailCtrl,
            keyboardType: TextInputType.emailAddress,
            decoration: const InputDecoration(labelText: 'Correo'),
          ),
          if (error != null) Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(error!, style: const TextStyle(color: Colors.red)),
          ),
          if (info != null) Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(info!, style: const TextStyle(color: Colors.green)),
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: loading ? null : () async {
              setState(() { loading = true; error = null; info = null; });
              try {
                await auth.sendPasswordReset(emailCtrl.text);
                setState(() => info = 'Te enviamos un correo para restablecer tu contraseña.');
              } on FirebaseAuthException catch (e) {
                setState(() => error = e.message ?? 'No se pudo enviar el correo');
              } finally {
                if (mounted) setState(() => loading = false);
              }
            },
            child: Text(loading ? 'Enviando…' : 'Enviar correo'),
          ),
          const SizedBox(height: 16),
          TextButton(
            onPressed: () => context.go('/login'),
            child: const Text('Volver a Iniciar sesión'),
          ),
        ]),
      ),
    );
  }
}
