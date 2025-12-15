const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function checkGitHubDeployment() {
    try {
        const owner = 'adityasingh03rajput';
        const repo = 'testing-server-';
        
        console.log('🔍 Checking GitHub Actions deployment status...');
        console.log(`📦 Repository: ${owner}/${repo}`);
        
        // Get the latest workflow runs
        const workflowsUrl = `https://api.github.com/repos/${owner}/${repo}/actions/runs`;
        console.log(`📡 Fetching: ${workflowsUrl}`);
        
        const response = await fetch(workflowsUrl, {
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'deployment-checker'
            }
        });
        
        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        console.log(`\n📊 Total workflow runs found: ${data.total_count}`);
        
        if (data.workflow_runs && data.workflow_runs.length > 0) {
            console.log('\n🚀 Recent Deployment Runs:');
            console.log('='.repeat(100));
            console.log('| Status      | Conclusion  | Branch | Commit Message                    | Started At          |');
            console.log('='.repeat(100));
            
            // Show the latest 5 runs
            const recentRuns = data.workflow_runs.slice(0, 5);
            
            recentRuns.forEach((run, index) => {
                const status = run.status.padEnd(11);
                const conclusion = (run.conclusion || 'pending').padEnd(11);
                const branch = run.head_branch.padEnd(6);
                const message = (run.head_commit?.message || 'No message').substring(0, 32).padEnd(32);
                const startedAt = new Date(run.created_at).toLocaleString().padEnd(19);
                
                console.log(`| ${status} | ${conclusion} | ${branch} | ${message} | ${startedAt} |`);
                
                // Show details for the latest run
                if (index === 0) {
                    console.log('='.repeat(100));
                    console.log(`\n🔍 Latest Run Details:`);
                    console.log(`   📋 Run ID: ${run.id}`);
                    console.log(`   📝 Workflow: ${run.name}`);
                    console.log(`   🌿 Branch: ${run.head_branch}`);
                    console.log(`   📦 Commit: ${run.head_sha.substring(0, 7)}`);
                    console.log(`   💬 Message: ${run.head_commit?.message || 'No message'}`);
                    console.log(`   ⏰ Started: ${new Date(run.created_at).toLocaleString()}`);
                    console.log(`   ⏱️  Updated: ${new Date(run.updated_at).toLocaleString()}`);
                    console.log(`   🔗 URL: ${run.html_url}`);
                    
                    if (run.status === 'completed') {
                        if (run.conclusion === 'success') {
                            console.log(`   ✅ Status: Deployment SUCCESSFUL`);
                        } else {
                            console.log(`   ❌ Status: Deployment FAILED (${run.conclusion})`);
                        }
                    } else {
                        console.log(`   ⏳ Status: Deployment IN PROGRESS`);
                    }
                }
            });
            
            console.log('='.repeat(100));
            
            // Check if latest deployment is our recent push
            const latestRun = recentRuns[0];
            const ourCommitMessage = 'Trigger Azure deployment - Update server version to v2.6 with departments endpoint';
            
            if (latestRun.head_commit?.message.includes('v2.6')) {
                console.log('\n🎯 Found our deployment!');
                
                if (latestRun.status === 'completed' && latestRun.conclusion === 'success') {
                    console.log('✅ Our deployment completed successfully!');
                    console.log('🔄 Testing Azure server now...');
                    
                    // Test the Azure server
                    await testAzureServer();
                } else if (latestRun.status === 'in_progress' || latestRun.status === 'queued') {
                    console.log('⏳ Our deployment is still in progress...');
                    console.log('💡 Please wait a few more minutes and check again');
                } else {
                    console.log('❌ Our deployment failed or was cancelled');
                }
            } else {
                console.log('⚠️  Our recent commit not found in latest runs');
                console.log('💡 Deployment might still be queued or starting');
            }
        } else {
            console.log('❌ No workflow runs found');
        }
        
    } catch (error) {
        console.error('❌ Error checking GitHub deployment:', error.message);
        
        if (error.message.includes('API rate limit')) {
            console.log('💡 GitHub API rate limit reached. Try again in a few minutes.');
        } else if (error.message.includes('Not Found')) {
            console.log('💡 Repository not found or not accessible. Check repository name and permissions.');
        }
    }
}

async function testAzureServer() {
    try {
        console.log('\n🌐 Testing Azure server endpoints...');
        const SERVER_URL = 'https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net';
        
        // Test health endpoint
        console.log('🏥 Testing health endpoint...');
        const healthResponse = await fetch(`${SERVER_URL}/api/health`);
        console.log(`   Status: ${healthResponse.status} ${healthResponse.statusText}`);
        
        // Test teachers endpoint
        console.log('👥 Testing teachers endpoint...');
        const teachersResponse = await fetch(`${SERVER_URL}/api/teachers`);
        if (teachersResponse.ok) {
            const teachersData = await teachersResponse.json();
            console.log(`   ✅ Teachers: ${teachersData.teachers?.length || 0} found`);
        } else {
            console.log(`   ❌ Teachers: ${teachersResponse.status} ${teachersResponse.statusText}`);
        }
        
        // Test departments endpoint (our new endpoint)
        console.log('🏢 Testing departments endpoint...');
        const deptResponse = await fetch(`${SERVER_URL}/api/departments`);
        if (deptResponse.ok) {
            const deptData = await deptResponse.json();
            console.log(`   ✅ Departments: ${deptData.departments?.length || 0} found`);
            console.log(`   📋 Available: ${deptData.departments?.map(d => d.name).join(', ') || 'None'}`);
        } else {
            console.log(`   ❌ Departments: ${deptResponse.status} ${deptResponse.statusText}`);
            if (deptResponse.status === 404) {
                console.log('   💡 Departments endpoint not deployed yet');
            }
        }
        
    } catch (error) {
        console.error('❌ Error testing Azure server:', error.message);
    }
}

// Run the check
checkGitHubDeployment();