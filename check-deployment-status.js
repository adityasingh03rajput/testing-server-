const https = require('https');

async function checkDeploymentStatus() {
    console.log('🔍 Checking GitHub Actions deployment status...');
    
    const url = 'https://api.github.com/repos/adityasingh03rajput/testing-server-/actions/runs?per_page=10';
    
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Node.js' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    const runs = response.workflow_runs;
                    
                    console.log('📊 Recent GitHub Actions runs:');
                    console.log('='.repeat(100));
                    
                    runs.slice(0, 8).forEach((run, i) => {
                        const message = run.head_commit.message.substring(0, 60);
                        const status = run.status;
                        const conclusion = run.conclusion || 'running';
                        const branch = run.head_branch;
                        const created = new Date(run.created_at).toLocaleString();
                        
                        console.log(`${i+1}. ${status.toUpperCase()} - ${conclusion.toUpperCase()}`);
                        console.log(`   Branch: ${branch}`);
                        console.log(`   Message: ${message}`);
                        console.log(`   Created: ${created}`);
                        console.log(`   URL: ${run.html_url}`);
                        console.log('');
                    });
                    
                    // Check if our recent commit is in the list
                    const recentCommit = runs.find(run => 
                        run.head_commit.message.includes('Fix rate limiting for concurrent student logins')
                    );
                    
                    if (recentCommit) {
                        console.log('✅ Found our rate limiting fix commit!');
                        console.log(`   Status: ${recentCommit.status}`);
                        console.log(`   Conclusion: ${recentCommit.conclusion || 'running'}`);
                        console.log(`   URL: ${recentCommit.html_url}`);
                        
                        if (recentCommit.status === 'completed' && recentCommit.conclusion === 'success') {
                            console.log('🎉 Deployment completed successfully!');
                        } else if (recentCommit.status === 'in_progress') {
                            console.log('⏳ Deployment still in progress...');
                        } else {
                            console.log('❌ Deployment may have failed');
                        }
                    } else {
                        console.log('⚠️  Rate limiting fix commit not found in recent runs');
                        console.log('💡 Deployment may still be queued or starting');
                    }
                    
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        }).on('error', reject);
    });
}

checkDeploymentStatus().catch(console.error);