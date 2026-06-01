app_name = "kglmart"

app {
  primary_region = "kgl"
  port = 8080

  process {
    name = "kglmart"
  }

  compute {
    cpu = 1
    memory = 512
    cpu_kind = "shared"
  }
}