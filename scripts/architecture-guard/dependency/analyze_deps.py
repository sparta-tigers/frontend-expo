import json

with open('reports/dependency-report.json', 'r') as f:
    data = json.load(f)

modules = data.get('modules', [])

domain_invasions = []
cross_feature_coupling = []
high_coupling_bottlenecks = []
low_cohesion_files = []

for m in modules:
    source = m['source']
    deps = m.get('dependencies', [])
    
    # 1. Domain Invasion (src/components/... -> app/)
    if any(source.startswith(prefix) for prefix in ['src/', 'components/', 'hooks/', 'styles/', 'context/']):
        for d in deps:
            resolved = d.get('resolved', '')
            if resolved.startswith('app/'):
                domain_invasions.append({
                    'file': source,
                    'to': resolved
                })

    # 2. Cross Feature Coupling (src/features/A -> src/features/B)
    if source.startswith('src/features/'):
        feature_a = source.split('/')[2]
        for d in deps:
            resolved = d.get('resolved', '')
            if resolved.startswith('src/features/'):
                parts = resolved.split('/')
                if len(parts) > 2:
                    feature_b = parts[2]
                    if feature_a != feature_b:
                        cross_feature_coupling.append({
                            'file': source,
                            'to': resolved,
                            'featureA': feature_a,
                            'featureB': feature_b
                        })

    # 3. High Coupling (Total Dependencies)
    if len(deps) > 10:
        high_coupling_bottlenecks.append({
            'file': source,
            'count': len(deps)
        })

    # 4. Low Cohesion (Excessive external folder imports)
    external_prefixes = ['hooks/', 'context/', 'styles/', 'src/hooks/', 'src/context/']
    external_count = 0
    for d in deps:
        resolved = d.get('resolved', '')
        if any(resolved.startswith(p) for p in external_prefixes):
            external_count += 1
    
    if external_count > 5:
        low_cohesion_files.append({
            'file': source,
            'external_count': external_count
        })

print("--- Domain Invasions (Lower Layers -> app/) ---")
for entry in domain_invasions:
    print(f"{entry['file']} -> {entry['to']}")

print("\n--- Cross Feature Coupling ---")
for entry in cross_feature_coupling:
    print(f"{entry['file']} ({entry['featureA']}) -> {entry['to']} ({entry['featureB']})")

print("\n--- High Coupling Bottlenecks (> 10 deps) ---")
for entry in sorted(high_coupling_bottlenecks, key=lambda x: x['count'], reverse=True):
    print(f"{entry['file']}: {entry['count']} dependencies")

print("\n--- Low Cohesion / High External Dependency (> 5 external) ---")
for entry in sorted(low_cohesion_files, key=lambda x: x['external_count'], reverse=True):
    print(f"{entry['file']}: {entry['external_count']} external folder imports")
