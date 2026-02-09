import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
import React from 'react';

interface LoginProps {
    onLoginSuccess: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    return (
        <div style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            width: '100%',
            background: '#050511',
            overflowX: 'hidden',
            fontFamily: "'Inter', sans-serif",
            color: 'white'
        }}>
            {/* Background Effects (Fixed) */}
            <div style={{
                position: 'fixed',
                top: '-20%',
                left: '-10%',
                width: '600px',
                height: '600px',
                background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(0,0,0,0) 70%)',
                borderRadius: '50%',
                filter: 'blur(80px)',
                zIndex: 0,
                pointerEvents: 'none'
            }} />
            <div style={{
                position: 'fixed',
                bottom: '-20%',
                right: '-10%',
                width: '600px',
                height: '600px',
                background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, rgba(0,0,0,0) 70%)',
                borderRadius: '50%',
                filter: 'blur(80px)',
                zIndex: 0,
                pointerEvents: 'none'
            }} />

            {/* Main Content (Flex Grow) */}
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                padding: '2rem',
                zIndex: 1
            }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2rem', // Compact gap
                    maxWidth: '600px',
                    width: '100%',
                    textAlign: 'center'
                }}>
                    {/* Header Section */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div className="logo" style={{
                            fontSize: '3rem',
                            marginBottom: '1rem',
                            background: 'linear-gradient(to right, #6366f1, #a855f7, #ec4899)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontWeight: 'bold',
                            letterSpacing: '-0.02em'
                        }}>
                            _Smart_Placement::AI
                        </div>

                        <h2 style={{
                            fontSize: '2rem',
                            fontWeight: '700',
                            marginBottom: '0.5rem',
                            color: '#f8fafc',
                            letterSpacing: '-0.01em',
                            textAlign: 'center'
                        }}>
                            Welcome Back
                        </h2>

                        <p style={{
                            color: '#94a3b8',
                            fontSize: '1rem',
                            lineHeight: '1.5',
                            maxWidth: '400px',
                            margin: '0 auto'
                        }}>
                            Sign in to access your intelligent career insights.
                        </p>
                    </div>

                    {/* Login Button Container */}
                    <div style={{
                        transform: 'scale(1.1)',
                        filter: 'drop-shadow(0 0 20px rgba(99, 102, 241, 0.2))',
                        marginTop: '0.5rem'
                    }}>
                        <GoogleLogin
                            onSuccess={credentialResponse => {
                                if (credentialResponse.credential) {
                                    const decoded: any = jwtDecode(credentialResponse.credential);
                                    onLoginSuccess({
                                        ...decoded,
                                        token: credentialResponse.credential
                                    });
                                }
                            }}
                            onError={() => console.log('Login Failed')}
                            theme="filled_black"
                            shape="pill"
                            size="large"
                            text="continue_with"
                        />
                    </div>

                    <div style={{
                        fontSize: '0.8rem',
                        color: 'rgba(255,255,255,0.3)',
                        marginTop: '1.5rem',
                        textAlign: 'center'
                    }}>
                        By continuing, you agree to our Terms of Service.
                        <br />
                        Secure & Private.
                    </div>
                </div>
            </div>

            {/* Footer (Static) */}
            <div style={{
                padding: '2rem',
                textAlign: 'center',
                color: '#475569',
                fontSize: '0.8rem',
                zIndex: 1,
                fontFamily: 'monospace'
            }}>
                SYSTEM_STATUS: ONLINE | V1.2.0-SECURE
            </div>
        </div>
    );
};

export default Login;
