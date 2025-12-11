import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldIcon, SpinnerIcon } from './icons';

const InteractiveDemo: React.FC = () => {
    const [isScanning, setIsScanning] = useState(false);
    const [results, setResults] = useState<any[]>([]);

    const mockResults = [
        { line: 15, severity: 'Critical', title: 'SQL Injection' },
        { line: 42, severity: 'High', title: 'Cross-Site Scripting (XSS)' },
        { line: 89, severity: 'Medium', title: 'Insecure Direct Object Reference' },
    ];

    const handleScan = () => {
        setIsScanning(true);
        setResults([]);

        mockResults.forEach((result, index) => {
            setTimeout(() => {
                setResults(prev => [...prev, result]);
                if (index === mockResults.length - 1) {
                    setIsScanning(false);
                }
            }, (index + 1) * 1000);
        });
    };

    const code = `
    // checkout_api.py
    from flask import Flask, request
    import sqlite3

    app = Flask(__name__)

    @app.route('/api/products/<id>')
    def get_product(id):
        conn = sqlite3.connect('db.sqlite')
        cursor = conn.cursor()

        # Is this line secure?
        query = f"SELECT * FROM products WHERE id = '{id}'"
        cursor.execute(query) # L15

        product = cursor.fetchone()
        conn.close()
        return jsonify(product)
    `;

    return (
        <div className="w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="text-left bg-void-black rounded-xl p-6 border border-white/10 font-mono text-sm relative group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-cyan to-electric-purple opacity-50 group-hover:opacity-100 transition-opacity"></div>
                    <pre className="text-gray-300 overflow-x-auto"><code>{code}</code></pre>
                </div>
                <div className="text-left flex flex-col h-full">
                    <button
                        onClick={handleScan}
                        disabled={isScanning}
                        className="w-full bg-white text-black font-bold py-4 rounded-xl mb-6 flex items-center justify-center text-lg disabled:opacity-50 hover:bg-neon-cyan transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                    >
                        {isScanning ? <SpinnerIcon className="w-6 h-6 mr-3 text-black" /> : <ShieldIcon severity="Critical" className="w-6 h-6 mr-3 text-black" />}
                        {isScanning ? 'Scanning...' : 'Run Sentinel Scan'}
                    </button>
                    <div className="space-y-3 flex-grow">
                        {results.length === 0 && !isScanning && (
                            <div className="h-full flex items-center justify-center text-gray-500 border-2 border-dashed border-white/10 rounded-xl p-8">
                                <p>Ready to scan. Click the button above.</p>
                            </div>
                        )}
                        {results.map((res, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-white/5 rounded-xl p-4 border border-white/10 flex items-center space-x-4 hover:border-neon-cyan/50 transition-colors"
                            >
                                <div className={`p-2 rounded-lg ${res.severity === 'Critical' ? 'bg-red-500/20 text-red-500' : res.severity === 'High' ? 'bg-orange-500/20 text-orange-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                                    <ShieldIcon severity={res.severity} className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="font-bold text-white">{res.title}</p>
                                    <p className="text-xs text-gray-400">Detected on Line {res.line} &bull; <span className="uppercase tracking-wider">{res.severity}</span></p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InteractiveDemo;