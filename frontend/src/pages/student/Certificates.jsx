import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, Badge } from '../../components/common/Surface';
import { certificateService } from '../../services/certificateService';

export const Certificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [issuer, setIssuer] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const fetchCertificates = useCallback(() => {
    setLoading(true);
    certificateService.getAll()
      .then(res => setCertificates(res || []))
      .catch(() => setError('Failed to load certificates.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  const handleUpload = async () => {
    if (!title || !issuer || !file) {
      setError('Please fill all fields and select a file.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('issuer', issuer);
      formData.append('file', file);
      
      await certificateService.upload(formData);
      setTitle('');
      setIssuer('');
      setFile(null);
      fetchCertificates();
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const getStatusTone = (status) => {
    switch(status) {
      case 'PENDING': return 'badge-warm';
      case 'UNDER_REVIEW': return 'badge-warm';
      case 'REJECTED': return 'badge-danger';
      case 'VALIDATED': return 'badge-primary';
      default: return 'badge-primary';
    }
  };

  return (
    <main className="page">
      <h1 className="title-lg">Certificates</h1>
      <p className="lead">Your verified accomplishments and external credentials.</p>

      <Card style={{ marginTop: 44, marginBottom: 44, background: '#f8f9fa' }}>
        <h2>Upload External Certificate</h2>
        <p className="muted" style={{ marginBottom: 24 }}>Got a credential from another platform? Add it to your Katalyst profile.</p>
        
        {error && <div className="badge badge-danger" style={{ marginBottom: 16 }}>{error}</div>}
        
        <div className="form-grid">
          <label>
            Certificate Title
            <input className="input" placeholder="e.g. AWS Cloud Practitioner" value={title} onChange={e => setTitle(e.target.value)} disabled={uploading} />
          </label>
          <label>
            Issuer / Organization
            <input className="input" placeholder="e.g. Amazon Web Services" value={issuer} onChange={e => setIssuer(e.target.value)} disabled={uploading} />
          </label>
        </div>
        <div style={{ marginTop: 24 }}>
          <label style={{ display: 'block', marginBottom: 8 }}>Upload File (PDF/Image)</label>
          <div className="surface" style={{ padding: '32px', textAlign: 'center', borderStyle: 'dashed' }}>
            {file ? (
              <div>
                <p><strong>{file.name}</strong></p>
                <button className="btn btn-ghost" style={{ marginTop: 8 }} onClick={() => setFile(null)}>Remove File</button>
              </div>
            ) : (
              <>
                <p className="muted">Drag and drop file here, or click to browse</p>
                <input 
                  type="file" 
                  id="certFile" 
                  style={{ display: 'none' }} 
                  onChange={e => setFile(e.target.files[0])}
                  accept="image/*,.pdf"
                />
                <button className="btn" style={{ marginTop: 16 }} onClick={() => document.getElementById('certFile').click()}>Choose File</button>
              </>
            )}
          </div>
        </div>
        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <button className="btn btn-primary" onClick={handleUpload} disabled={uploading || !title || !issuer || !file}>
            {uploading ? 'Uploading...' : 'Upload Credential'}
          </button>
        </div>
      </Card>

      <h2>Your Credentials</h2>
      {loading ? (
        <p className="muted" style={{ marginTop: 24 }}>Loading certificates...</p>
      ) : certificates.length === 0 ? (
        <p className="muted" style={{ marginTop: 24 }}>No certificates found.</p>
      ) : (
        <div className="grid grid-3" style={{ marginTop: 24 }}>
          {certificates.map(cert => (
            <Card key={cert.id || cert._id}>
              {cert.status && <Badge tone={getStatusTone(cert.status)} style={{ float: 'right' }}>{cert.status}</Badge>}
              <Badge style={{ float: 'right', marginRight: cert.status ? 8 : 0 }}>{cert.type || 'External'}</Badge>
              <div className="surface" style={{ padding: 24, marginTop: 12 }}>
                <h3>{cert.title}</h3>
                <p className="muted">{cert.issuer || 'Katalyst AI'}</p>
                <p style={{ marginTop: 8 }}>Issued: {cert.issued ? new Date(cert.issued).toLocaleDateString() : 'Pending Validation'}</p>
                {cert.feedback && <p className="muted small" style={{ marginTop: 12, fontStyle: 'italic' }}>Feedback: {cert.feedback}</p>}
                {cert.status === 'VALIDATED' || !cert.status ? (
                  <Link className="btn" to={`/student/certificate/${cert.id || cert._id}`} style={{ marginTop: 16, display: 'inline-block' }}>View Certificate</Link>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
};
