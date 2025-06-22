import Link from 'next/link'

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem', paddingTop: '4rem', paddingBottom: '4rem' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '3.75rem', fontWeight: 'bold', color: '#111827', marginBottom: '1rem' }}>
            TaskFlow
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#6b7280', marginBottom: '2rem' }}>
            מערכת ניהול משימות חכמה ומתקדמת
          </p>
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '4rem' }}>
            <Link
              href="/login"
              style={{
                padding: '0.75rem 2rem',
                backgroundColor: '#2563eb',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '0.5rem',
                fontSize: '1.125rem',
                fontWeight: '500'
              }}
            >
              התחברות
            </Link>
            <Link
              href="/register"
              style={{
                padding: '0.75rem 2rem',
                backgroundColor: 'white',
                color: '#2563eb',
                textDecoration: 'none',
                border: '1px solid #2563eb',
                borderRadius: '0.5rem',
                fontSize: '1.125rem',
                fontWeight: '500'
              }}
            >
              הרשמה
            </Link>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '4rem' }}>
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', textAlign: 'center' }}>
            <div style={{ 
              width: '3rem', 
              height: '3rem', 
              backgroundColor: '#dbeafe', 
              borderRadius: '0.5rem', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 1rem',
              fontSize: '1.5rem'
            }}>
              📋
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>ניהול משימות</h3>
            <p style={{ color: '#6b7280' }}>יצירה, עריכה ומעקב אחר משימות בצורה פשוטה ויעילה</p>
          </div>
          
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', textAlign: 'center' }}>
            <div style={{ 
              width: '3rem', 
              height: '3rem', 
              backgroundColor: '#dcfce7', 
              borderRadius: '0.5rem', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 1rem',
              fontSize: '1.5rem'
            }}>
              📊
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>אנליטיקה</h3>
            <p style={{ color: '#6b7280' }}>סטטיסטיקות מפורטות וניתוח ביצועים</p>
          </div>
          
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', textAlign: 'center' }}>
            <div style={{ 
              width: '3rem', 
              height: '3rem', 
              backgroundColor: '#fae8ff', 
              borderRadius: '0.5rem', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 1rem',
              fontSize: '1.5rem'
            }}>
              👥
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>שיתוף פעולה</h3>
            <p style={{ color: '#6b7280' }}>עבודת צוות משותפת ויעילה</p>
          </div>
        </div>
      </div>
    </div>
  )
}