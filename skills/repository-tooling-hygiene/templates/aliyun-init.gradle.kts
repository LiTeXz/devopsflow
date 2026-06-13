allprojects {
    repositories {
        maven {
            url = uri("https://maven.aliyun.com/repository/public/")
            name = "aliyun-public"
        }
        maven {
            url = uri("https://maven.aliyun.com/repository/spring/")
            name = "aliyun-spring"
        }
        maven {
            url = uri("https://maven.aliyun.com/repository/gradle-plugin/")
            name = "aliyun-gradle-plugin"
        }

        mavenCentral()
        gradlePluginPortal()
        mavenLocal()
    }

    buildscript {
        repositories {
            maven {
                url = uri("https://maven.aliyun.com/repository/public/")
                name = "aliyun-public"
            }
            maven {
                url = uri("https://maven.aliyun.com/repository/gradle-plugin/")
                name = "aliyun-gradle-plugin"
            }
            gradlePluginPortal()
            mavenCentral()
        }
    }
}
