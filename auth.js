// Módulo de Autenticação e Controle de Acesso (Google Auth)
const ADMIN_EMAILS = ['renatonakashima@gmail.com']; // Administrador configurado

let currentUser = null;

// Inicializar observador de autenticação
function initAuth(onAuthReady) {
    if (typeof firebase === 'undefined' || !firebase.auth) {
        console.error('Firebase Auth não carregado.');
        return;
    }

    // Verificar se retornou de redirect do Google
    firebase.auth().getRedirectResult().then((result) => {
        if (result && result.user) {
            console.log('Login via redirect bem-sucedido:', result.user.email);
        }
    }).catch((error) => {
        console.error('Erro no redirect do Google:', error);
    });

    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || user.email.split('@')[0],
                photoURL: user.photoURL,
                isAdmin: ADMIN_EMAILS.includes(user.email.toLowerCase())
            };
            console.log('Usuário autenticado:', currentUser.email, currentUser.isAdmin ? '(Admin)' : '');
            hideAuthModal();
            updateUserUI();
            if (typeof onAuthReady === 'function') {
                await onAuthReady(currentUser);
            }
        } else {
            currentUser = null;
            console.log('Nenhum usuário logado. Exibindo modal de login.');
            showAuthModal();
        }
    });
}

// Entrar com Google (Tenta popup, se falhar ou bloquear, usa redirect)
async function loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        await firebase.auth().signInWithPopup(provider);
    } catch (error) {
        console.warn('Popup bloqueada ou falhou, tentando login com redirect...', error);
        try {
            await firebase.auth().signInWithRedirect(provider);
        } catch (redirectError) {
            console.error('Erro no login com Google (Redirect):', redirectError);
            alert('Erro ao autenticar com o Google: ' + redirectError.message);
        }
    }
}

// Sair da conta
async function logoutUser() {
    try {
        await firebase.auth().signOut();
        window.location.reload();
    } catch (error) {
        console.error('Erro ao sair:', error);
    }
}

// Exibir modal de login
function showAuthModal() {
    let modal = document.getElementById('authModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'authModal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(8px);
            display: flex; justify-content: center; align-items: center; z-index: 99999;
        `;
        modal.innerHTML = `
            <div style="background: #1e293b; padding: 40px; border-radius: 16px; width: 100%; max-width: 420px; text-align: center; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); border: 1px solid #334155; color: #f8fafc;">
                <h2 style="margin-bottom: 12px; font-size: 24px; font-weight: 700;">📊 Best Options</h2>
                <p style="color: #94a3b8; margin-bottom: 30px; font-size: 14px;">Faça login com sua conta Google para acessar suas operações com segurança na nuvem.</p>
                <button onclick="loginWithGoogle()" style="width: 100%; background: #ffffff; color: #1e293b; border: none; padding: 14px; border-radius: 8px; font-weight: 600; font-size: 15px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); transition: background 0.2s;">
                    <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.13 0-5.78-2.11-6.73-4.96H1.19v3.15C3.17 21.36 7.21 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.19C.43 8.15 0 9.89 0 11.75s.43 3.6 1.19 5.14l4.08-3.15z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.21 0 3.17 2.64 1.19 6.61l4.08 3.15c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
                    Entrar com o Google
                </button>
            </div>
        `;
        document.body.appendChild(modal);
    }
    modal.style.display = 'flex';
}

function hideAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Atualizar interface do cabeçalho com dados do usuário e botão Admin se aplicável
function updateUserUI() {
    if (!currentUser) return;

    // Procurar header actions ou criar barra de usuário
    const headerActions = document.querySelector('.header-actions');
    if (headerActions && !document.getElementById('userInfoBadge')) {
        const userBadge = document.createElement('div');
        userBadge.id = 'userInfoBadge';
        userBadge.style.cssText = 'display: flex; align-items: center; gap: 10px; background: rgba(30, 41, 59, 0.7); padding: 6px 12px; border-radius: 8px; border: 1px solid #334155; font-size: 13px; color: #f8fafc;';
        
        let adminHtml = '';
        if (currentUser.isAdmin) {
            adminHtml = `<a href="admin.html" style="background: #3b82f6; color: white; padding: 6px 12px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 12px; margin-left: 5px;">👑 Painel Admin</a>`;
        }

        userBadge.innerHTML = `
            <img src="${currentUser.photoURL || 'https://www.gravatar.com/avatar/?d=mp'}" style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover;">
            <span style="font-weight: 500;">${currentUser.displayName}</span>
            ${adminHtml}
            <button onclick="logoutUser()" title="Sair" style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px; margin-left: 5px;">Sair</button>
        `;
        headerActions.insertBefore(userBadge, headerActions.firstChild);
    }
}
