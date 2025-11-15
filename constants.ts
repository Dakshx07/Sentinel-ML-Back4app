import { SampleRepo } from './types';

export const SQL_INJECTION_EXAMPLE: SampleRepo = {
  id: 'sql-injection-py',
  name: 'Python Web App',
  description: 'Find the SQL injection vulnerability in this checkout API.',
  files: [
    {
      name: 'app.py',
      language: 'python',
      content: `
import os
from flask import Flask, request, jsonify
import sqlite3

app = Flask(__name__)

def get_db_connection():
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/api/products/<product_id>')
def get_product(product_id):
    conn = get_db_connection()
    # VULNERABILITY: Direct string formatting for SQL query
    product = conn.execute(f"SELECT * FROM products WHERE id = '{product_id}'").fetchone()
    conn.close()
    if product is None:
        return jsonify({'error': 'Product not found'}), 404
    return jsonify(dict(product))

if __name__ == '__main__':
    # Setup dummy database for demo
    conn = get_db_connection()
    conn.execute('CREATE TABLE IF NOT EXISTS products (id TEXT, name TEXT, price REAL)')
    conn.execute("INSERT OR IGNORE INTO products VALUES ('abc-123', 'Quantum Widget', 99.99)")
    conn.commit()
    conn.close()
    app.run(debug=True)
      `,
    },
  ],
};

export const SAMPLE_REPOS: SampleRepo[] = [
  SQL_INJECTION_EXAMPLE,
  {
    id: 'xss-react',
    name: 'React Frontend',
    description: 'Identify the cross-site scripting (XSS) risk.',
    files: [
      {
        name: 'Comment.tsx',
        language: 'typescript',
        content: `
import React from 'react';

interface CommentProps {
  author: string;
  content: string;
}

const Comment: React.FC<CommentProps> = ({ author, content }) => {
  return (
    <div className="comment-container">
      <h4 className="author">{author}</h4>
      {/* VULNERABILITY: Using dangerouslySetInnerHTML with untrusted content */}
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
};

export default Comment;
      `
      },
      {
        name: 'data.ts',
        language: 'typescript',
        content: `
// Example of potentially malicious user-provided content
export const maliciousComment = {
  author: 'Mallory',
  content: 'Nice post! <img src=x onerror="alert(\'XSS Attack!\')" />'
};
        `
      }
    ]
  },
  {
    id: 'iac-secrets',
    name: 'Terraform IaC',
    description: 'Detect hardcoded secrets in an IaC configuration.',
    files: [
      {
        name: 'main.tf',
        language: 'hcl',
        content: `
provider "aws" {
  region = "us-east-1"
}

resource "aws_db_instance" "default" {
  allocated_storage    = 20
  storage_type         = "gp2"
  engine               = "mysql"
  engine_version       = "5.7"
  instance_class       = "db.t2.micro"
  name                 = "mydb"
  username             = "admin"
  # VULNERABILITY: Hardcoded password in configuration file
  password             = "SuperSecretPassword123!"
  parameter_group_name = "default.mysql5.7"
  skip_final_snapshot  = true
}
      `
      }
    ]
  }
];
