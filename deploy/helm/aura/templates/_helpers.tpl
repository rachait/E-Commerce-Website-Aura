{{- define "aura.name" -}}
{{- .Chart.Name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "aura.fullname" -}}
{{- printf "%s-%s" .Release.Name (include "aura.name" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}
