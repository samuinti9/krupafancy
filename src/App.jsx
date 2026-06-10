import React, { useState, useEffect } from 'react';
import { ShoppingCart, Package, ListTodo, Plus, Minus, Trash2, Share2, Receipt, BookOpen, Users, CreditCard, ChevronLeft, Printer, Tag, TrendingUp, AlertTriangle, Settings, Sun, Moon, FileText, ChevronDown, ChevronUp, Download, Upload, Database, Lock, Key, ShieldCheck, LockOpen, Calculator, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import CryptoJS from 'crypto-js';

// Mock initial data removed - owner starts fresh
const initialProducts = [];
const initialLists = [];
const initialCustomers = [];

// Helper functions for Encryption
const encryptData = (data, secret) => {
  if (!secret) return JSON.stringify(data);
  return CryptoJS.AES.encrypt(JSON.stringify(data), secret).toString();
};

const decryptData = (ciphertext, secret) => {
  if (!ciphertext) return null;
  try {
    // If it starts with '[' or '{', it might be unencrypted plain JSON from before the security update
    if (ciphertext.startsWith('[') || ciphertext.startsWith('{')) return JSON.parse(ciphertext);
    const bytes = CryptoJS.AES.decrypt(ciphertext, secret);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted ? JSON.parse(decrypted) : null;
  } catch (e) {
    return null;
  }
};

function App() {
  const [activeTab, setActiveTab] = useState('pos');
  const [products, setProducts] = useState(initialProducts);
  
  // Theme State
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    document.body.className = theme + '-theme';
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  // Bill Rows State
  const [billRows, setBillRows] = useState([{ id: Date.now(), name: '', price: '', qty: 1, discount: '' }]);
  const [showInvoice, setShowInvoice] = useState(false);
  const [billCustomer, setBillCustomer] = useState({ name: '', phone: '', address: '', soldBy: '' });
  const [customerLists, setCustomerLists] = useState(initialLists);

  // Billing Enhancements State
  const [overallDiscount, setOverallDiscount] = useState('');
  const [salesHistory, setSalesHistory] = useState([]);
  const [expandedBillId, setExpandedBillId] = useState(null);
  
  const [storeSettings, setStoreSettings] = useState(() => {
    const saved = localStorage.getItem('storeSettings');
    return saved ? JSON.parse(saved) : {
      storeName: 'Krupa Fancy General Stores',
      propName: 'Inti jyothi venkata madhava rao',
      phone: '9959191673',
      upiId: 'yourstore@upi'
    };
  });

  const handleSaveSettings = (e) => {
    e.preventDefault();
    localStorage.setItem('storeSettings', JSON.stringify(storeSettings));
    alert("Settings saved successfully!");
  };

  // Khata State
  const [customers, setCustomers] = useState(initialCustomers);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', address: '' });
  const [paymentAmount, setPaymentAmount] = useState('');

  // --- Calculator State ---
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcInput, setCalcInput] = useState('');

  const handleCalcClick = (val) => {
    if (val === 'C') {
      setCalcInput('');
    } else if (val === '=') {
      try {
        const result = new Function('return ' + calcInput)();
        setCalcInput(String(Math.round(result * 100) / 100));
      } catch(e) {
        setCalcInput('Error');
      }
    } else {
      if (calcInput === 'Error') setCalcInput(val);
      else setCalcInput(prev => prev + val);
    }
  };

  // --- Security & Auth State ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [masterPassword, setMasterPassword] = useState('');
  const [authInput, setAuthInput] = useState('');
  const [isSettingUp, setIsSettingUp] = useState(() => !localStorage.getItem('krupa_auth_hash'));
  const [authError, setAuthError] = useState('');

  const loadEncryptedData = (secret) => {
    const rp = localStorage.getItem('krupa_products');
    if (rp) { const p = decryptData(rp, secret); if (p) setProducts(p); }
    
    const rl = localStorage.getItem('krupa_customerLists');
    if (rl) { const l = decryptData(rl, secret); if (l) setCustomerLists(l); }
    
    const rs = localStorage.getItem('krupa_salesHistory');
    if (rs) { const s = decryptData(rs, secret); if (s) setSalesHistory(s); }
    
    const rc = localStorage.getItem('krupa_customers');
    if (rc) { const c = decryptData(rc, secret); if (c) setCustomers(c); }
  };

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    if (isSettingUp) {
      if (authInput.length < 4) {
        setAuthError("Password must be at least 4 characters.");
        return;
      }
      const hash = CryptoJS.SHA256(authInput).toString();
      localStorage.setItem('krupa_auth_hash', hash);
      setMasterPassword(authInput);
      setIsAuthenticated(true);
      loadEncryptedData(authInput);
    } else {
      const storedHash = localStorage.getItem('krupa_auth_hash');
      const inputHash = CryptoJS.SHA256(authInput).toString();
      if (storedHash === inputHash) {
        setMasterPassword(authInput);
        setIsAuthenticated(true);
        loadEncryptedData(authInput);
      } else {
        setAuthError("Incorrect password. Please try again.");
      }
    }
  };

  // Local Storage Effects for Persistence (Only save if authenticated)
  useEffect(() => {
    if (isAuthenticated) localStorage.setItem('krupa_products', encryptData(products, masterPassword));
  }, [products, isAuthenticated, masterPassword]);

  useEffect(() => {
    if (isAuthenticated) localStorage.setItem('krupa_customerLists', encryptData(customerLists, masterPassword));
  }, [customerLists, isAuthenticated, masterPassword]);

  useEffect(() => {
    if (isAuthenticated) localStorage.setItem('krupa_salesHistory', encryptData(salesHistory, masterPassword));
  }, [salesHistory, isAuthenticated, masterPassword]);

  useEffect(() => {
    if (isAuthenticated) localStorage.setItem('krupa_customers', encryptData(customers, masterPassword));
  }, [customers, isAuthenticated, masterPassword]);

  // Data Export/Import
  const handleExportData = () => {
    const data = { products, customerLists, salesHistory, customers, storeSettings };
    const encryptedPayload = CryptoJS.AES.encrypt(JSON.stringify(data), masterPassword).toString();
    const blob = new Blob([encryptedPayload], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Krupa_Store_Encrypted_Backup_${new Date().toISOString().split('T')[0]}.enc`;
    link.click();
  };

  const handleImportData = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const ciphertext = event.target.result;
        let dataStr;
        try {
          const bytes = CryptoJS.AES.decrypt(ciphertext, masterPassword);
          dataStr = bytes.toString(CryptoJS.enc.Utf8);
        } catch(e) {
          dataStr = ciphertext;
        }

        const data = JSON.parse(dataStr || ciphertext);
        if (data.products) setProducts(data.products);
        if (data.customerLists) setCustomerLists(data.customerLists);
        if (data.salesHistory) setSalesHistory(data.salesHistory);
        if (data.customers) setCustomers(data.customers);
        if (data.storeSettings) {
          setStoreSettings(data.storeSettings);
          localStorage.setItem('storeSettings', JSON.stringify(data.storeSettings));
        }
        alert("Data imported successfully!");
      } catch (err) {
        alert("Failed to import data. Invalid file or wrong master password.");
        console.error(err);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  // Inventory State
  const [newProduct, setNewProduct] = useState({ name: '', price: '', purchasePrice: '', stock: '' });

  // Auto-add empty row when the last row is used
  useEffect(() => {
    if (billRows.length === 0) {
      setBillRows([{ id: Date.now(), name: '', price: '', qty: 1, discount: '' }]);
      return;
    }
    const lastRow = billRows[billRows.length - 1];
    if (lastRow.name !== '' || lastRow.price !== '') {
      setBillRows([...billRows, { id: Date.now(), name: '', price: '', qty: 1, discount: '' }]);
    }
  }, [billRows]);

  const validRows = billRows.filter(row => row.name || row.price);

  const handleRowChange = (id, field, value) => {
    setBillRows(billRows.map(row => {
      if (row.id === id) {
        const updatedRow = { ...row, [field]: value };
        
        // Auto-fill price if name matches inventory
        if (field === 'name') {
          const matchedProduct = products.find(p => p.name.toLowerCase() === value.toLowerCase());
          if (matchedProduct) {
            updatedRow.price = matchedProduct.price;
          }
        }
        return updatedRow;
      }
      return row;
    }));
  };

  const removeRow = (id) => {
    if (billRows.length === 1) return; // don't remove last empty row
    setBillRows(billRows.filter(row => row.id !== id));
  };

  const subtotal = validRows.reduce((sum, item) => sum + ((Number(item.price) * Number(item.qty)) - (Number(item.discount) || 0)), 0);
  const discountVal = Number(overallDiscount) || 0;
  const finalTotal = Math.max(0, subtotal - discountVal);

  const handleCheckout = () => {
    if (validRows.length === 0) return;
    setShowInvoice(true);
  };

  const loadList = (list) => {
    const loadedRows = list.items.map((listItem, index) => {
      const product = products.find(p => p.id === listItem.id);
      if(product) {
        return { id: Date.now() + index, name: product.name, price: product.price, qty: listItem.qty, discount: '' };
      }
      return null;
    }).filter(item => item !== null);
    
    setBillRows([...loadedRows, { id: Date.now() + 1000, name: '', price: '', qty: 1, discount: '' }]);
    setActiveTab('pos');
  };

  const updateStockLevels = (items) => {
    setProducts(prevProducts => {
      return prevProducts.map(p => {
        const matchedItem = items.find(it => it.name.toLowerCase() === p.name.toLowerCase());
        if (matchedItem) {
          return { ...p, stock: Math.max(0, p.stock - matchedItem.qty) };
        }
        return p;
      });
    });
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price || !newProduct.purchasePrice) return;
    setProducts([...products, { 
      ...newProduct, 
      id: Date.now(), 
      price: Number(newProduct.price), 
      purchasePrice: Number(newProduct.purchasePrice),
      stock: newProduct.stock ? Number(newProduct.stock) : 0 
    }]);
    setNewProduct({ name: '', price: '', purchasePrice: '', stock: '' });
  };

  // Khata Functions
  const handleAddCustomer = (e) => {
    e.preventDefault();
    if (!newCustomer.name) return;
    setCustomers([...customers, { ...newCustomer, id: Date.now(), balance: 0, transactions: [] }]);
    setNewCustomer({ name: '', phone: '', address: '' });
  };

  const handleReceivePayment = (e) => {
    e.preventDefault();
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0 || !selectedCustomer) return;

    const updatedCustomers = customers.map(c => {
      if (c.id === selectedCustomer.id) {
        const newTx = { id: Date.now(), date: new Date().toLocaleString(), type: 'payment', amount: amount, note: 'Payment Received' };
        return { ...c, balance: c.balance - amount, transactions: [newTx, ...c.transactions] };
      }
      return c;
    });

    setCustomers(updatedCustomers);
    setSelectedCustomer(updatedCustomers.find(c => c.id === selectedCustomer.id));
    setPaymentAmount('');
  };

  const handleBillToKhata = (customerId) => {
    if (!customerId) return;
    
    const itemsPurchased = validRows.map(row => ({
      name: row.name,
      qty: Number(row.qty),
      price: Number(row.price),
      discount: Number(row.discount) || 0
    }));

    const updatedCustomers = customers.map(c => {
      if (c.id === Number(customerId)) {
        const newTx = { 
          id: Date.now(), 
          date: new Date().toLocaleString(), 
          type: 'credit', 
          amount: finalTotal, 
          note: 'Store Purchase',
          items: itemsPurchased
        };
        return { ...c, balance: c.balance + finalTotal, transactions: [newTx, ...c.transactions] };
      }
      return c;
    });

    setCustomers(updatedCustomers);

    const newSale = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      items: itemsPurchased,
      subtotal,
      discount: discountVal,
      total: finalTotal,
      paymentType: 'Khata',
      customerName: customers.find(c => c.id === Number(customerId))?.name || 'Customer'
    };
    setSalesHistory(prev => [newSale, ...prev]);
    updateStockLevels(itemsPurchased);

    setBillRows([{ id: Date.now(), name: '', price: '', qty: 1, discount: '' }]);
    setOverallDiscount('');
    setBillCustomer({ name: '', phone: '', address: '', soldBy: '' });
    setShowInvoice(false);
    alert("Bill successfully added to Khata!");
  };

  const handleCashPaymentDone = () => {
    const itemsPurchased = validRows.map(row => ({
      name: row.name,
      qty: Number(row.qty),
      price: Number(row.price),
      discount: Number(row.discount) || 0
    }));

    const newSale = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      items: itemsPurchased,
      subtotal,
      discount: discountVal,
      total: finalTotal,
      paymentType: 'Cash',
      customerName: billCustomer.name || 'Walk-in Customer'
    };
    setSalesHistory(prev => [newSale, ...prev]);
    updateStockLevels(itemsPurchased);

    setBillRows([{ id: Date.now(), name: '', price: '', qty: 1, discount: '' }]);
    setOverallDiscount('');
    setBillCustomer({ name: '', phone: '', address: '', soldBy: '' });
    setShowInvoice(false);
  };

  // Invoice Component
  const InvoiceModal = () => {
    const [selectedKhataId, setSelectedKhataId] = useState('');
    const [sharePhone, setSharePhone] = useState('');
    const upiLink = `upi://pay?pa=${storeSettings.upiId}&pn=${encodeURIComponent(storeSettings.storeName)}&am=${finalTotal}&cu=INR`;

    const handleKhataSelect = (id) => {
      setSelectedKhataId(id);
      if (id) {
        const cust = customers.find(c => c.id === Number(id));
        if (cust) {
          setSharePhone(cust.phone || '');
          setBillCustomer({
            name: cust.name || '',
            phone: cust.phone || '',
            address: cust.address || ''
          });
        }
      }
    };

    const handleWhatsAppShare = async () => {
      const element = document.getElementById('invoice-capture');
      if (!element) return;
      
      try {
        const canvas = await html2canvas(element, { scale: 2 });
        
        canvas.toBlob(async (blob) => {
          let imageCopied = false;
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            imageCopied = true;
          } catch (clipErr) {
            console.log("Clipboard write failed, downloading instead", clipErr);
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `Bill_${Date.now()}.png`;
            link.href = dataUrl;
            link.click();
          }

          if (imageCopied) {
            alert("✅ Bill image copied to clipboard!\n\nWhatsApp will now open. Just press 'Ctrl + V' (or Right-Click -> Paste) in the chat to send the bill.");
          } else {
            alert("✅ Bill image downloaded!\n\nWhatsApp will now open. Please attach the downloaded image in the chat.");
          }

          let formattedPhone = sharePhone.trim();
          if (formattedPhone.length === 10) {
            formattedPhone = '91' + formattedPhone;
          }
          const whatsappUrl = `https://wa.me/${formattedPhone}`;
          window.open(whatsappUrl, '_blank');
        }, 'image/png');
      } catch (err) {
        console.error('Error generating bill image', err);
        alert('Failed to generate bill image.');
      }
    };

    const handleDownloadPdf = async () => {
      const element = document.getElementById('invoice-capture');
      if (!element) return;
      try {
        const canvas = await html2canvas(element, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Krupa_Bill_${Date.now()}.pdf`);
      } catch (err) {
        console.error('Error generating PDF', err);
        alert('Failed to generate PDF. Please try again.');
      }
    };

    const handleShare = async () => {
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Store Invoice',
            text: `Invoice Total: ₹${finalTotal}. Thank you for shopping!`,
          });
        } catch (error) {
          console.log('Error sharing', error);
        }
      } else {
        alert("Web Share API not supported on this browser.");
      }
    };

    return (
      <div className="modal-overlay">
        <div className="invoice-modal">
          <div id="invoice-capture" style={{background: 'white', padding: '16px', borderRadius: '8px', color: 'black'}}>
            <div className="invoice-header">
            <img src="/logo.png" alt="" style={{height: '80px', marginBottom: '16px'}} onError={(e) => e.target.style.display='none'} />
            <h2 style={{marginBottom: '4px', fontSize: '1.6rem', color: '#4f46e5'}}>{storeSettings.storeName}</h2>
            <p style={{fontSize: '0.95rem', color: '#4b5563', marginBottom: '2px', fontWeight: 600}}>
              Prop: {storeSettings.propName}
            </p>
            <p style={{fontSize: '0.95rem', color: '#4b5563', marginBottom: '16px', fontWeight: 600}}>
              Ph: {storeSettings.phone}
            </p>
            <p style={{fontWeight: 'bold', borderBottom: '1px dashed #cbd5e1', paddingBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px'}}>Invoice / Bill</p>
          </div>
          <div className="invoice-details" style={{display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: '1px dashed #cbd5e1', paddingBottom: '12px', marginBottom: '12px', fontSize: '0.85rem', color: '#4b5563'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', width: '100%'}}>
              <span>Date: {new Date().toLocaleDateString()}</span>
              <span>Time: {new Date().toLocaleTimeString()}</span>
            </div>
            
            {(() => {
              const displayCustomer = selectedKhataId 
                ? (customers.find(c => c.id === Number(selectedKhataId)) || billCustomer) 
                : billCustomer;
              
              if (displayCustomer.name || displayCustomer.phone || displayCustomer.address) {
                return (
                  <div style={{marginTop: '8px', borderTop: '1px dotted #e2e8f0', paddingTop: '8px', textAlign: 'left', width: '100%'}}>
                    <div style={{fontWeight: 700, marginBottom: '2px', color: '#1f2937'}}>Customer Details:</div>
                    {displayCustomer.name && <div>Name: {displayCustomer.name}</div>}
                    {displayCustomer.phone && <div>Phone: {displayCustomer.phone}</div>}
                    {displayCustomer.address && <div>Address: {displayCustomer.address}</div>}
                  </div>
                );
              }
              return null;
            })()}
          </div>
          {/* Sold By footer on invoice */}
          {billCustomer.soldBy && (
            <p style={{textAlign: 'right', fontSize: '0.8rem', color: '#6b7280', marginTop: '12px', borderTop: '1px dashed #e5e7eb', paddingTop: '10px'}}>
              Sold by: <strong>{billCustomer.soldBy}</strong>
            </p>
          )}
          <table className="invoice-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Discount</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {validRows.map(item => {
                const itemTotal = (Number(item.price) * Number(item.qty)) - (Number(item.discount) || 0);
                return (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.qty}</td>
                    <td>₹{item.price}</td>
                    <td style={{color: 'var(--secondary)'}}>{item.discount ? `-₹${item.discount}` : '-'}</td>
                    <td>₹{itemTotal}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <th colSpan="4">Subtotal</th>
                <th>₹{subtotal}</th>
              </tr>
              {discountVal > 0 && (
                <tr style={{color: 'var(--secondary)'}}>
                  <th colSpan="4">Additional Overall Discount</th>
                  <th>- ₹{discountVal}</th>
                </tr>
              )}
              <tr>
                <th colSpan="4" style={{fontSize: '1.4rem'}}>Total</th>
                <th style={{fontSize: '1.4rem'}}>₹{finalTotal}</th>
              </tr>
            </tfoot>
          </table>
          
          <div className="qr-container no-print">
            <p>Scan to Pay ₹{finalTotal}</p>
            <QRCodeSVG value={upiLink} size={150} />
          </div>
          </div>

          <div className="no-print" style={{background: 'rgba(37, 211, 102, 0.1)', padding: '16px', borderRadius: '12px', marginBottom: '16px', border: '1px solid rgba(37, 211, 102, 0.2)'}}>
            <p style={{fontWeight: 600, marginBottom: '8px', color: '#10b981'}}>Share Bill on WhatsApp</p>
            <div style={{display: 'flex', gap: '8px'}}>
              <input 
                type="tel" 
                placeholder="10-digit Phone Number" 
                value={sharePhone} 
                onChange={e => setSharePhone(e.target.value)}
                style={{flex: 1, color: 'black', background: 'white', border: '1px solid #ccc', padding: '8px', borderRadius: '8px'}}
              />
              <button className="btn-primary" style={{background: '#10b981', borderColor: '#10b981', color: 'white', display: 'flex', alignItems: 'center', gap: '8px'}} onClick={handleWhatsAppShare}>
                <Share2 size={16} /> Send WhatsApp
              </button>
            </div>
          </div>

          <div className="no-print" style={{background: 'rgba(0,0,0,0.03)', padding: '16px', borderRadius: '12px', marginBottom: '24px'}}>
            <p style={{fontWeight: 600, marginBottom: '8px'}}>Add to Khata instead of Cash?</p>
            <div style={{display: 'flex', gap: '8px'}}>
              <select style={{color: 'black', background: 'white'}} value={selectedKhataId} onChange={e => handleKhataSelect(e.target.value)}>
                <option value="">Select Customer...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button className="btn-secondary" disabled={!selectedKhataId} onClick={() => handleBillToKhata(selectedKhataId)}>
                Add
              </button>
            </div>
          </div>

          <div className="modal-actions no-print">
            <button className="btn-secondary" onClick={() => window.print()}><Printer size={16} /> Print</button>
            <button className="btn-secondary" onClick={handleDownloadPdf}><Download size={16} /> PDF</button>
            <button className="btn-secondary" onClick={handleShare}><Share2 size={16} /> Share</button>
            <button className="btn-primary" onClick={handleCashPaymentDone}>Cash Paid (Done)</button>
          </div>
          <button className="btn-danger no-print" style={{width: '100%', marginTop: '12px'}} onClick={() => setShowInvoice(false)}>Cancel / Edit Bill</button>
        </div>
      </div>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="app-container" style={{justifyContent: 'center', alignItems: 'center'}}>
        <div className="card" style={{maxWidth: '400px', width: '100%', padding: '32px', textAlign: 'center'}}>
          <ShieldCheck size={64} color="#10b981" style={{margin: '0 auto 16px'}} />
          <h2 style={{marginBottom: '8px', fontSize: '1.5rem'}}>{isSettingUp ? "Set Up Master Security" : "App Locked"}</h2>
          <p style={{color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.9rem', lineHeight: 1.5}}>
            {isSettingUp 
              ? "Create a Master Password to securely encrypt all your store data. If you lose this password, your data cannot be recovered."
              : "Enter your Master Password to decrypt your store data and access the application."}
          </p>
          
          <form onSubmit={handleAuthSubmit}>
            <div className="form-group">
              <input 
                type="password" 
                placeholder="Master Password" 
                value={authInput}
                onChange={e => {setAuthInput(e.target.value); setAuthError('');}}
                style={{width: '100%', padding: '12px', fontSize: '1.1rem', textAlign: 'center'}}
                autoFocus
              />
            </div>
            {authError && <p style={{color: '#ef4444', fontSize: '0.9rem', marginBottom: '16px'}}>{authError}</p>}
            <button type="submit" className="btn-primary" style={{width: '100%', justifyContent: 'center', padding: '12px'}}>
              {isSettingUp ? <Key size={20} /> : <Lock size={20} />}
              {isSettingUp ? "Encrypt & Save" : "Unlock App"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar no-print">
        <h1 style={{fontSize: '1.2rem'}}>
          <img src="/logo.png" alt="" style={{height: '24px', borderRadius: '4px', background: 'white', padding: '2px'}} onError={(e) => e.target.style.display='none'} /> 
          {storeSettings.storeName}
        </h1>
        <button className={`nav-btn ${activeTab === 'pos' ? 'active' : ''}`} onClick={() => setActiveTab('pos')}>
          <ShoppingCart size={20} /> Billing Entry
        </button>
        <button className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          <TrendingUp size={20} /> Sales Dashboard
        </button>
        <button className={`nav-btn ${activeTab === 'khata' ? 'active' : ''}`} onClick={() => {setActiveTab('khata'); setSelectedCustomer(null)}}>
          <BookOpen size={20} /> Digital Khata
        </button>
        <button className={`nav-btn ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>
          <Package size={20} /> Inventory
        </button>
        <button className={`nav-btn ${activeTab === 'lists' ? 'active' : ''}`} onClick={() => setActiveTab('lists')}>
          <ListTodo size={20} /> Customer Lists
        </button>
        <button className={`nav-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          <Settings size={20} /> Settings
        </button>
        <button className={`nav-btn ${activeTab === 'bills' ? 'active' : ''}`} onClick={() => setActiveTab('bills')}>
          <FileText size={20} /> Today's Bills
        </button>
        
        {/* Theme Toggle Button */}
        <button 
          className="nav-btn" 
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} 
          style={{marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '8px'}}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        </button>
      </div>

      {/* Main Content */}
      <div className="main-content no-print">
        
        {/* BILLING ENTRY SYSTEM */}
        {activeTab === 'pos' && (
          <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
            <div className="header">
              <h2>Billing Entry</h2>
            </div>

            {/* Optional Customer info card */}
            <div className="card" style={{padding: '16px 24px', marginBottom: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap'}}>
              <div className="form-group" style={{flex: '1 1 200px', marginBottom: 0}}>
                <label style={{fontSize: '0.85rem', marginBottom: '6px', fontWeight: 600}}>Customer Name (Optional)</label>
                <input 
                  type="text" 
                  value={billCustomer.name} 
                  onChange={e => setBillCustomer({...billCustomer, name: e.target.value})} 
                  placeholder="Enter Customer Name"
                  style={{padding: '8px 12px', fontSize: '0.9rem'}}
                />
              </div>
              <div className="form-group" style={{flex: '1 1 150px', marginBottom: 0}}>
                <label style={{fontSize: '0.85rem', marginBottom: '6px', fontWeight: 600}}>Contact Phone (Optional)</label>
                <input 
                  type="tel" 
                  value={billCustomer.phone} 
                  onChange={e => setBillCustomer({...billCustomer, phone: e.target.value})} 
                  placeholder="10-digit phone number"
                  style={{padding: '8px 12px', fontSize: '0.9rem'}}
                />
              </div>
              <div className="form-group" style={{flex: '2 1 300px', marginBottom: 0}}>
                <label style={{fontSize: '0.85rem', marginBottom: '6px', fontWeight: 600}}>Address (Optional)</label>
                <input 
                  type="text" 
                  value={billCustomer.address} 
                  onChange={e => setBillCustomer({...billCustomer, address: e.target.value})} 
                  placeholder="Street, Area details..."
                  style={{padding: '8px 12px', fontSize: '0.9rem'}}
                />
              </div>
              <div className="form-group" style={{flex: '1 1 150px', marginBottom: 0}}>
                <label style={{fontSize: '0.85rem', marginBottom: '6px', fontWeight: 600}}>Sold By (Optional)</label>
                <input 
                  type="text" 
                  value={billCustomer.soldBy} 
                  onChange={e => setBillCustomer({...billCustomer, soldBy: e.target.value})} 
                  placeholder="Staff / Owner name"
                  style={{padding: '8px 12px', fontSize: '0.9rem'}}
                />
              </div>
            </div>

            <div className="card" style={{flex: 1, overflowY: 'auto', padding: '0'}}>
              <table className="data-table" style={{margin: 0, width: '100%'}}>
                <thead style={{position: 'sticky', top: 0, zIndex: 1}}>
                  <tr>
                    <th style={{width: '50px', textAlign: 'center'}}>#</th>
                    <th>Product Name</th>
                    <th style={{width: '120px'}}>Price (₹)</th>
                    <th style={{width: '100px'}}>Qty</th>
                    <th style={{width: '120px'}}>Disc. (₹)</th>
                    <th style={{width: '120px'}}>Total (₹)</th>
                    <th style={{width: '60px'}}></th>
                  </tr>
                </thead>
                <tbody>
                  <datalist id="product-suggestions">
                    {products.map(p => <option key={p.id} value={p.name} />)}
                  </datalist>
                  
                  {billRows.map((row, index) => {
                    const rowTotal = (Number(row.price) * Number(row.qty)) - (Number(row.discount) || 0);
                    return (
                      <tr key={row.id}>
                        <td style={{textAlign: 'center', color: 'var(--text-muted)'}}>{index + 1}</td>
                        <td>
                          <input 
                            list="product-suggestions"
                            value={row.name} 
                            onChange={e => handleRowChange(row.id, 'name', e.target.value)} 
                            placeholder="Enter Item Name..."
                            style={{width: '100%', background: 'transparent', border: '1px solid var(--border)'}}
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            value={row.price} 
                            onChange={e => handleRowChange(row.id, 'price', e.target.value)} 
                            placeholder="0.00"
                            style={{width: '100%', background: 'transparent', border: '1px solid var(--border)'}}
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            value={row.qty} 
                            min="1"
                            onChange={e => handleRowChange(row.id, 'qty', e.target.value)} 
                            style={{width: '100%', background: 'transparent', border: '1px solid var(--border)'}}
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            value={row.discount} 
                            onChange={e => handleRowChange(row.id, 'discount', e.target.value)} 
                            placeholder="0"
                            style={{width: '100%', background: 'transparent', border: '1px solid var(--border)', color: 'var(--secondary)'}}
                          />
                        </td>
                        <td style={{fontWeight: 'bold'}}>
                          ₹{row.name || row.price ? Math.max(0, rowTotal) : '0'}
                        </td>
                        <td style={{textAlign: 'center'}}>
                          {index !== billRows.length - 1 && (
                            <button className="qty-btn" onClick={() => removeRow(row.id)} style={{background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', margin: '0 auto'}}>
                              <Trash2 size={14}/>
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Billing Footer */}
            <div className="card" style={{marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
                <span style={{fontSize: '1.2rem', color: 'var(--text-muted)'}}>Subtotal: ₹{subtotal}</span>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: '8px'}}>
                  <Tag size={18} color="var(--secondary)"/> 
                  <span style={{color: 'var(--secondary)'}}>Overall Discount:</span>
                  <input 
                    type="number" 
                    value={overallDiscount}
                    onChange={e => setOverallDiscount(e.target.value)}
                    placeholder="₹ 0"
                    style={{width: '100px', background: 'white', color: 'black'}}
                  />
                </div>
              </div>
              
              <div style={{display: 'flex', alignItems: 'center', gap: '24px'}}>
                <div style={{textAlign: 'right'}}>
                  <p style={{fontSize: '0.9rem', color: 'var(--text-muted)'}}>Final Total</p>
                  <p style={{fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-main)'}}>₹{finalTotal}</p>
                </div>
                <button className="btn-primary" style={{padding: '16px 32px', fontSize: '1.2rem'}} onClick={handleCheckout} disabled={validRows.length === 0}>
                  Generate Bill
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ... Khata, Inventory, and Lists Tabs remain exactly the same as before ... */}
        {activeTab === 'khata' && (
          <div>
            {!selectedCustomer ? (
              <>
                <div className="header">
                  <h2>Digital Khata</h2>
                </div>
                
                <div className="pos-layout" style={{height: 'auto'}}>
                  <div style={{flex: 2}}>
                    <div className="product-grid">
                      {customers.map(customer => (
                        <div key={customer.id} className="product-card" style={{justifyContent: 'center'}} onClick={() => setSelectedCustomer(customer)}>
                          <h3>{customer.name}</h3>
                          <p style={{color: 'var(--text-muted)'}}>{customer.phone}</p>
                          <div style={{marginTop: '16px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px'}}>
                            <p style={{fontSize: '0.9rem'}}>Pending Balance</p>
                            <p style={{fontSize: '1.4rem', fontWeight: 'bold', color: customer.balance > 0 ? '#fca5a5' : 'var(--secondary)'}}>
                              ₹{customer.balance}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="cart-section" style={{height: 'fit-content'}}>
                    <h3><Users size={18} style={{marginRight: '8px', verticalAlign: 'middle'}}/> Add New Customer</h3>
                    <form onSubmit={handleAddCustomer} style={{marginTop: '16px'}}>
                      <div className="form-group">
                        <label>Customer Name</label>
                        <input type="text" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} required/>
                      </div>
                      <div className="form-group">
                        <label>Phone Number</label>
                        <input type="tel" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})}/>
                      </div>
                      <div className="form-group">
                        <label>Address Details</label>
                        <input type="text" placeholder="Street, Area, landmark..." value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})}/>
                      </div>
                      <button type="submit" className="btn-primary" style={{width: '100%'}}><Plus size={18}/> Add Customer</button>
                    </form>
                  </div>
                </div>
              </>
            ) : (
              <div>
                <div className="header" style={{justifyContent: 'flex-start', gap: '16px'}}>
                  <button className="btn-secondary" onClick={() => setSelectedCustomer(null)}><ChevronLeft size={20}/> Back</button>
                  <h2>{selectedCustomer.name}'s Ledger</h2>
                </div>

                <div className="pos-layout" style={{height: 'auto'}}>
                  <div className="card" style={{flex: 1}}>
                    <h3 style={{fontSize: '1.5rem', color: selectedCustomer.balance > 0 ? '#fca5a5' : 'var(--secondary)'}}>
                      Total Due: ₹{selectedCustomer.balance}
                    </h3>
                    <p style={{color: 'var(--text-muted)', marginBottom: '4px'}}>Phone: {selectedCustomer.phone || 'N/A'}</p>
                    <p style={{color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.9rem'}}>Address: {selectedCustomer.address || 'N/A'}</p>
                    
                    <form onSubmit={handleReceivePayment} style={{background: 'rgba(16, 185, 129, 0.1)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.2)'}}>
                      <h4 style={{marginBottom: '12px', color: 'var(--secondary)'}}>Record Payment Received</h4>
                      <div style={{display: 'flex', gap: '12px'}}>
                        <input type="number" placeholder="Amount (₹)" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} required />
                        <button type="submit" className="btn-secondary"><CreditCard size={18}/> Receive</button>
                      </div>
                    </form>
                  </div>

                  <div className="card" style={{flex: 2}}>
                    <h3>Transaction History</h3>
                    <table className="data-table" style={{marginTop: '16px'}}>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Details</th>
                          <th>Amount</th>
                          <th>Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedCustomer.transactions.map(tx => (
                          <tr key={tx.id}>
                            <td>{tx.date}</td>
                            <td>
                              <div style={{fontWeight: 600}}>{tx.note}</div>
                              {tx.items && tx.items.length > 0 && (
                                <div style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', background: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border)'}}>
                                  {tx.items.map((it, idx) => (
                                    <div key={idx} style={{margin: '2px 0'}}>
                                      • {it.name} ({it.qty} x ₹{it.price}) {it.discount ? `[-₹${it.discount}]` : ''}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td style={{fontWeight: 'bold', color: tx.type === 'payment' ? 'var(--secondary)' : '#fca5a5'}}>
                              ₹{tx.amount}
                            </td>
                            <td>
                              <span style={{
                                padding: '4px 10px', 
                                borderRadius: '12px', 
                                fontSize: '0.8rem',
                                background: tx.type === 'payment' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                                color: tx.type === 'payment' ? '#6ee7b7' : '#fca5a5'
                              }}>
                                {tx.type.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {selectedCustomer.transactions.length === 0 && (
                          <tr><td colSpan="4" style={{textAlign: 'center', color: 'var(--text-muted)'}}>No transactions yet.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'inventory' && (
          <div>
            <div className="header">
              <h2>Inventory Management</h2>
            </div>
            <div className="card">
              <h3>Add New Product</h3>
              <form onSubmit={handleAddProduct} style={{display: 'flex', gap: '16px', marginTop: '16px', alignItems: 'flex-end', flexWrap: 'wrap'}}>
                <div className="form-group" style={{flex: '1 1 200px', marginBottom: 0}}>
                  <label>Product Name</label>
                  <input type="text" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} required/>
                </div>
                <div className="form-group" style={{flex: '1 1 100px', marginBottom: 0}}>
                  <label>Purchase Price / Cost Price (₹)</label>
                  <input type="number" value={newProduct.purchasePrice} onChange={e => setNewProduct({...newProduct, purchasePrice: e.target.value})} placeholder="Buying Price" required/>
                </div>
                <div className="form-group" style={{flex: '1 1 100px', marginBottom: 0}}>
                  <label>Selling Price (₹)</label>
                  <input type="number" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} required/>
                </div>
                <div className="form-group" style={{flex: '1 1 100px', marginBottom: 0}}>
                  <label>Initial Stock (Optional)</label>
                  <input type="number" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} placeholder="0"/>
                </div>
                <button type="submit" className="btn-primary" style={{height: '46px'}}><Plus size={20} /> Add Item</button>
              </form>
            </div>
            <div className="card">
              <h3>Current Stock</h3>
              <table className="data-table" style={{marginTop: '16px'}}>
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Purchase Price</th>
                    <th>Selling Price</th>
                    <th>Stock Level</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td>₹{product.purchasePrice || '0'}</td>
                      <td>₹{product.price}</td>
                      <td>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          background: product.stock < 10 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                          color: product.stock < 10 ? '#fca5a5' : '#6ee7b7'
                        }}>
                          {product.stock} units
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SALES DASHBOARD TAB */}
        {activeTab === 'dashboard' && (() => {
          const totalSalesVal = salesHistory.reduce((sum, s) => sum + s.total, 0);
          const cashSalesVal = salesHistory.filter(s => s.paymentType === 'Cash').reduce((sum, s) => sum + s.total, 0);
          const khataSalesVal = salesHistory.filter(s => s.paymentType === 'Khata').reduce((sum, s) => sum + s.total, 0);
          
          const totalProfitVal = salesHistory.reduce((sum, sale) => {
            const saleProfit = sale.items.reduce((itemSum, item) => {
              const matchedProduct = products.find(p => p.name.toLowerCase() === item.name.toLowerCase());
              const costPrice = matchedProduct ? Number(matchedProduct.purchasePrice) : Number(item.price) * 0.8;
              return itemSum + ((item.price - costPrice) * item.qty) - item.discount;
            }, 0);
            return sum + (saleProfit - sale.discount);
          }, 0);

          const lowStockProducts = products.filter(p => p.stock < 10);

          return (
            <div>
              <div className="header">
                <h2>Sales & Profit Dashboard</h2>
              </div>

              {/* Stats Cards */}
              <div className="product-grid" style={{marginBottom: '24px'}}>
                <div className="card" style={{marginBottom: 0, borderLeft: '4px solid var(--primary)'}}>
                  <p style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>Total Sales (Today)</p>
                  <h3 style={{fontSize: '2rem', marginTop: '8px', color: 'var(--text-main)'}}>₹{totalSalesVal}</h3>
                </div>
                <div className="card" style={{marginBottom: 0, borderLeft: '4px solid var(--secondary)'}}>
                  <p style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>Cash Sales</p>
                  <h3 style={{fontSize: '2rem', marginTop: '8px', color: 'var(--secondary)'}}>₹{cashSalesVal}</h3>
                </div>
                <div className="card" style={{marginBottom: 0, borderLeft: '4px solid #f59e0b'}}>
                  <p style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>Khata Credit Sales</p>
                  <h3 style={{fontSize: '2rem', marginTop: '8px', color: '#f59e0b'}}>₹{khataSalesVal}</h3>
                </div>
                <div className="card" style={{marginBottom: 0, borderLeft: '4px solid #10b981'}}>
                  <p style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>Total Net Profit</p>
                  <h3 style={{fontSize: '2rem', marginTop: '8px', color: '#10b981'}}>₹{Math.max(0, Math.round(totalProfitVal))}</h3>
                </div>
              </div>

              <div className="pos-layout" style={{height: 'auto', gap: '24px'}}>
                {/* Left Side: Recent Sales */}
                <div className="card" style={{flex: 2, marginBottom: 0}}>
                  <h3>Recent Sales History</h3>
                  <div style={{overflowX: 'auto', marginTop: '16px'}}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Items</th>
                          <th>Method</th>
                          <th>Total</th>
                          <th>Est. Profit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesHistory.map(sale => {
                          const saleProfit = sale.items.reduce((itemSum, item) => {
                            const matchedProduct = products.find(p => p.name.toLowerCase() === item.name.toLowerCase());
                            const costPrice = matchedProduct ? Number(matchedProduct.purchasePrice) : Number(item.price) * 0.8;
                            return itemSum + ((item.price - costPrice) * item.qty) - item.discount;
                          }, 0) - sale.discount;

                          return (
                            <tr key={sale.id}>
                              <td style={{fontSize: '0.85rem'}}>{sale.date.split(',')[1]}</td>
                              <td style={{fontSize: '0.85rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                                {sale.items.map(it => `${it.name} (${it.qty})`).join(', ')}
                              </td>
                              <td>
                                <span style={{
                                  padding: '2px 8px',
                                  borderRadius: '8px',
                                  fontSize: '0.75rem',
                                  background: sale.paymentType === 'Cash' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                  color: sale.paymentType === 'Cash' ? '#6ee7b7' : '#fcd34d'
                                }}>
                                  {sale.paymentType}
                                </span>
                              </td>
                              <td style={{fontWeight: 'bold'}}>₹{sale.total}</td>
                              <td style={{color: '#10b981', fontWeight: 600}}>₹{Math.round(saleProfit)}</td>
                            </tr>
                          );
                        })}
                        {salesHistory.length === 0 && (
                          <tr>
                            <td colSpan="5" style={{textAlign: 'center', color: 'var(--text-muted)'}}>No sales completed today yet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right Side: Low Stock Warnings */}
                <div className="card" style={{flex: 1, marginBottom: 0, height: 'fit-content'}}>
                  <h3 style={{display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444'}}>
                    <AlertTriangle size={20} /> Low Stock Alerts
                  </h3>
                  <div style={{marginTop: '16px'}}>
                    {lowStockProducts.map(p => (
                      <div key={p.id} style={{display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)'}}>
                        <span>{p.name}</span>
                        <span style={{color: '#ef4444', fontWeight: 'bold'}}>{p.stock} left</span>
                      </div>
                    ))}
                    {lowStockProducts.length === 0 && (
                      <p style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>All products have sufficient stock level.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* TODAY'S BILLS TAB */}
        {activeTab === 'bills' && (() => {
          const todayTotal = salesHistory.reduce((sum, s) => sum + s.total, 0);
          const cashCount = salesHistory.filter(s => s.paymentType === 'Cash').length;
          const khataCount = salesHistory.filter(s => s.paymentType === 'Khata').length;
          return (
            <div>
              <div className="header">
                <h2>Today's Bills</h2>
                <div style={{display: 'flex', gap: '16px', alignItems: 'center', fontSize: '0.95rem', color: 'var(--text-muted)'}}>
                  <span>{salesHistory.length} bills today</span>
                  <span style={{fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-main)'}}>Total: ₹{todayTotal}</span>
                </div>
              </div>

              <div style={{display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap'}}>
                <div style={{padding: '10px 20px', borderRadius: '24px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', fontWeight: 600}}>
                  💵 {cashCount} Cash Bills
                </div>
                <div style={{padding: '10px 20px', borderRadius: '24px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#f59e0b', fontWeight: 600}}>
                  📒 {khataCount} Khata Bills
                </div>
              </div>

              {salesHistory.length === 0 && (
                <div className="card" style={{textAlign: 'center', padding: '48px', color: 'var(--text-muted)'}}>
                  <FileText size={48} style={{margin: '0 auto 16px', opacity: 0.4}}/>
                  <p style={{fontSize: '1.1rem'}}>No bills generated today yet.</p>
                  <p style={{fontSize: '0.9rem', marginTop: '8px'}}>Go to Billing Entry to create your first bill.</p>
                </div>
              )}

              {salesHistory.map((sale, index) => (
                <div key={sale.id} className="card" style={{marginBottom: '12px', padding: '0', overflow: 'hidden'}}>
                  <div
                    onClick={() => setExpandedBillId(expandedBillId === sale.id ? null : sale.id)}
                    style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', cursor: 'pointer', userSelect: 'none'}}
                  >
                    <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem',
                        background: sale.paymentType === 'Cash' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: sale.paymentType === 'Cash' ? '#10b981' : '#f59e0b'
                      }}>
                        #{salesHistory.length - index}
                      </div>
                      <div>
                        <div style={{fontWeight: 600, fontSize: '1rem'}}>{sale.customerName || 'Walk-in Customer'}</div>
                        <div style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px'}}>
                          {sale.date} &nbsp;•&nbsp;
                          <span style={{
                            padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem',
                            background: sale.paymentType === 'Cash' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: sale.paymentType === 'Cash' ? '#10b981' : '#f59e0b'
                          }}>{sale.paymentType}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
                      <span style={{fontWeight: 700, fontSize: '1.2rem'}}>₹{sale.total}</span>
                      {expandedBillId === sale.id ? <ChevronUp size={20} color="var(--text-muted)"/> : <ChevronDown size={20} color="var(--text-muted)"/>}
                    </div>
                  </div>

                  {expandedBillId === sale.id && (
                    <div style={{borderTop: '1px solid var(--border)', padding: '16px 20px'}}>
                      <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem'}}>
                        <thead>
                          <tr style={{color: 'var(--text-muted)', fontWeight: 600}}>
                            <td style={{paddingBottom: '8px'}}>Item</td>
                            <td style={{paddingBottom: '8px', textAlign: 'center'}}>Qty</td>
                            <td style={{paddingBottom: '8px', textAlign: 'right'}}>Price</td>
                            <td style={{paddingBottom: '8px', textAlign: 'right'}}>Disc.</td>
                            <td style={{paddingBottom: '8px', textAlign: 'right'}}>Total</td>
                          </tr>
                        </thead>
                        <tbody>
                          {sale.items.map((item, i) => (
                            <tr key={i} style={{borderTop: '1px solid var(--border)'}}>
                              <td style={{padding: '8px 0', fontWeight: 500}}>{item.name}</td>
                              <td style={{padding: '8px 0', textAlign: 'center', color: 'var(--text-muted)'}}>{item.qty}</td>
                              <td style={{padding: '8px 0', textAlign: 'right'}}>₹{item.price}</td>
                              <td style={{padding: '8px 0', textAlign: 'right', color: '#10b981'}}>{item.discount ? `-₹${item.discount}` : '-'}</td>
                              <td style={{padding: '8px 0', textAlign: 'right', fontWeight: 600}}>₹{(item.price * item.qty) - item.discount}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr style={{borderTop: '2px solid var(--border)'}}>
                            <td colSpan="4" style={{paddingTop: '10px', fontWeight: 600, textAlign: 'right', paddingRight: '8px'}}>Subtotal:</td>
                            <td style={{paddingTop: '10px', textAlign: 'right', fontWeight: 600}}>₹{sale.subtotal}</td>
                          </tr>
                          {sale.discount > 0 && (
                            <tr>
                              <td colSpan="4" style={{textAlign: 'right', paddingRight: '8px', color: '#10b981'}}>Overall Discount:</td>
                              <td style={{textAlign: 'right', color: '#10b981'}}>-₹{sale.discount}</td>
                            </tr>
                          )}
                          <tr>
                            <td colSpan="4" style={{textAlign: 'right', paddingRight: '8px', fontWeight: 700, fontSize: '1rem', paddingTop: '6px'}}>Grand Total:</td>
                            <td style={{textAlign: 'right', fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary)', paddingTop: '6px'}}>₹{sale.total}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })()}

        {activeTab === 'lists' && (
          <div>
            <div className="header">
              <h2>Saved Customer Lists</h2>
            </div>
            <div className="product-grid">
              {customerLists.map(list => (
                <div key={list.id} className="card" style={{marginBottom: 0}}>
                  <h3>{list.name}</h3>
                  <p style={{color: 'var(--text-muted)', margin: '12px 0'}}>{list.items.length} items</p>
                  <button className="btn-primary" style={{width: '100%', justifyContent: 'center'}} onClick={() => loadList(list)}>
                    Load to Bill
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STORE SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div style={{maxWidth: '600px'}}>
            <div className="header">
              <h2>Store Settings</h2>
            </div>
            <div className="card">
              <h3>Configure Invoice & Payments</h3>
              <form onSubmit={handleSaveSettings} style={{marginTop: '20px'}}>
                <div className="form-group">
                  <label>Store Name</label>
                  <input 
                    type="text" 
                    value={storeSettings.storeName} 
                    onChange={e => setStoreSettings({...storeSettings, storeName: e.target.value})} 
                    style={{width: '100%'}}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Proprietor Name (Owner)</label>
                  <input 
                    type="text" 
                    value={storeSettings.propName} 
                    onChange={e => setStoreSettings({...storeSettings, propName: e.target.value})} 
                    style={{width: '100%'}}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Contact Phone Number</label>
                  <input 
                    type="tel" 
                    value={storeSettings.phone} 
                    onChange={e => setStoreSettings({...storeSettings, phone: e.target.value})} 
                    style={{width: '100%'}}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>UPI ID (For GPay / PhonePe QR Code)</label>
                  <input 
                    type="text" 
                    placeholder="example@upi"
                    value={storeSettings.upiId} 
                    onChange={e => setStoreSettings({...storeSettings, upiId: e.target.value})} 
                    style={{width: '100%'}}
                    required
                  />
                  <small style={{color: 'var(--text-muted)', display: 'block', marginTop: '6px'}}>
                    This is used to automatically generate the QR code on bills. Customers scanning the QR will pay directly to this UPI ID.
                  </small>
                </div>
                <button type="submit" className="btn-primary" style={{width: '100%', marginTop: '8px'}}>Save Settings</button>
              </form>
            </div>

            <div className="card" style={{marginTop: '24px'}}>
              <h3 style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <Database size={20} /> Data Backup & Restore
              </h3>
              <p style={{color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '8px', marginBottom: '16px'}}>
                Protect your store's data by downloading a backup. You can restore it later if you switch devices or clear your browser data.
              </p>
              
              <div style={{display: 'flex', gap: '16px', flexWrap: 'wrap'}}>
                <button className="btn-secondary" onClick={handleExportData} style={{flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'}}>
                  <Download size={18} /> Export Backup (Download)
                </button>
                
                <label className="btn-primary" style={{flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0}}>
                  <Upload size={18} /> Import Backup (Restore)
                  <input 
                    type="file" 
                    accept=".json" 
                    style={{display: 'none'}} 
                    onChange={handleImportData}
                  />
                </label>
              </div>
              <div style={{marginTop: '16px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444', borderRadius: '4px'}}>
                <p style={{fontSize: '0.85rem', color: '#ef4444', margin: 0}}>
                  <strong>Warning:</strong> Importing a backup will overwrite your current products, customers, and sales history.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {showInvoice && <InvoiceModal />}

      {/* Floating Calculator Button */}
      {isAuthenticated && (
        <button 
          onClick={() => setShowCalculator(!showCalculator)}
          style={{
            position: 'fixed', bottom: '24px', right: '24px', zIndex: 50,
            width: '60px', height: '60px', borderRadius: '30px',
            background: 'var(--primary)', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px var(--primary-glow)', border: 'none', cursor: 'pointer',
            transition: 'transform 0.3s'
          }}
          className="no-print"
        >
          {showCalculator ? <X size={28}/> : <Calculator size={28}/>}
        </button>
      )}

      {/* Floating Calculator Widget */}
      {isAuthenticated && showCalculator && (
        <div style={{
          position: 'fixed', bottom: '100px', right: '24px', zIndex: 50,
          background: 'var(--surface)', backdropFilter: 'var(--glass-blur)',
          WebkitBackdropFilter: 'var(--glass-blur)',
          border: '1px solid var(--border)', borderRadius: '16px',
          width: '280px', padding: '20px', boxShadow: 'var(--shadow)'
        }} className="no-print">
          <input 
            type="text" 
            value={calcInput} 
            readOnly 
            style={{width: '100%', marginBottom: '16px', textAlign: 'right', fontSize: '1.8rem', padding: '12px', background: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid var(--border)', borderRadius: '8px'}} 
          />
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px'}}>
            {['7','8','9','/','4','5','6','*','1','2','3','-','C','0','.','+'].map(btn => (
              <button 
                key={btn}
                onClick={() => handleCalcClick(btn)}
                style={{
                  padding: '16px 0', fontSize: '1.3rem', fontWeight: 600,
                  background: ['/','*','-','+'].includes(btn) ? 'var(--primary)' : btn === 'C' ? 'var(--danger)' : 'var(--input-bg)',
                  color: ['/','*','-','+','C'].includes(btn) ? 'white' : 'var(--text-main)',
                  border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                {btn}
              </button>
            ))}
            <button 
              onClick={() => handleCalcClick('=')}
              style={{
                gridColumn: 'span 4', padding: '16px 0', fontSize: '1.4rem', fontWeight: 700,
                background: 'var(--secondary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '4px',
                boxShadow: '0 4px 15px var(--secondary-glow)'
              }}
            >
              =
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
