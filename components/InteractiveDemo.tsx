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
        <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-dark-text dark:text-white font-heading mb-4">Sentinel in Action</h2>
            <p className="max-w-3xl mx-auto text-lg text-medium-dark-text dark:text-medium-text mb-12">
                Don't just take our word for it. See how Sentinel dissects code to find critical vulnerabilities in a real-world scenario.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="text-left bg-light-primary dark:bg-dark-primary rounded-lg p-4 border border-gray-200 dark:border-white/10 font-mono text-sm">
                    <pre><code>{code}</code></pre>
                </div>
                <div className="text-left">
                    <button onClick={handleScan} disabled={isScanning} className="w-full btn-primary py-3 mb-4 flex items-center justify-center text-lg disabled:opacity-50">
                        {isScanning ? <SpinnerIcon className="w-6 h-6 mr-3" /> : <ShieldIcon severity="Critical" className="w-6 h-6 mr-3" />}
                        {isScanning ? 'Scanning...' : 'Run Sentinel Scan'}
                    </button>
                    <div className="space-y-3">
                        {results.map((res, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-light-primary dark:bg-dark-primary rounded-lg p-4 border border-gray-200 dark:border-white/10 flex items-center space-x-4"
                            >
                                <ShieldIcon severity={res.severity} className="w-8 h-8 flex-shrink-0" />
                                <div>
                                    <p className="font-bold text-dark-text dark:text-white">{res.title}</p>
                                    <p className="text-sm text-medium-dark-text dark:text-medium-text">Detected on Line {res.line} &bull; {res.severity}</p>
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