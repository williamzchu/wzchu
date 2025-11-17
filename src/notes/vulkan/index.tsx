import Code from "../../Code";

const code1 =  `vkInstance instance;
VkApplicationInfo appInfo{};
appInfo.sType = VK_STRUCTURE_TYPE_APPLICATION_INFO;
appInfo.pApplicationName = "Hello Triangle";
appInfo.applicationVersion = VK_MAKE_VERSION(1, 0, 0);
appInfo.pEngineName = "No Engine";
appInfo.engineVersion = VK_MAKE_VERSION(1, 0, 0);
appInfo.apiVersion = VK_API_VERSION_1_0;

VkInstanceCreateInfo createInfo{};
createInfo.sType = VK_STRUCTURE_TYPE_INSTANCE_CREATE_INFO;
createInfo.pApplicationInfo = &appInfo;
createInfo.enabledExtensionCount = 0;
createInfo.ppEnabledExtensionNames = nullptr;

createInfo.enabledLayerCount = 0;

if (vkCreateInstance(&createInfo, nullptr, &instance) != VK_SUCCESS) {
    throw std::runtime_error("failed to create instance!");
}

vkDestroyInstance(instance, nullptr);`

const code2 = `
constexpr vk::ApplicationInfo appInfo{ .pApplicationName   = "Hello Triangle",
    .applicationVersion = VK_MAKE_VERSION( 1, 0, 0 ),
    .pEngineName        = "No Engine",
    .engineVersion      = VK_MAKE_VERSION( 1, 0, 0 ),
    .apiVersion         = vk::ApiVersion14 };
vk::InstanceCreateInfo createInfo{
    .pApplicationInfo = &appInfo
};
instance = vk::raii::Instance(context, createInfo);
`

const skeleton = `
#if defined(__INTELLISENSE__) || !defined(USE_CPP20_MODULES)
#include <vulkan/vulkan_raii.hpp>
#else
import vulkan_hpp;
#endif
#include <GLFW/glfw3.h>

#include <iostream>
#include <stdexcept>
#include <cstdlib>

class VulkanRenderer {
public:
    void run() {
        initVulkan();
        mainLoop();
        cleanup();
    }

private:
    void initVulkan() {

    }

    void mainLoop() {

    }

    void cleanup() {

    }
};

int main() {
    VulkanRenderer app;

    try {
        app.run();
    }
    catch (const std::exception& e) {
        std::cerr << e.what() << std::endl;
        return EXIT_FAILURE;
    }

    return EXIT_SUCCESS;
}
`

export default function Vulkan(){

    return <div>
        <p>
        These are my notes adapted from Alexander Overvoorde's Vulkan <a href="https://docs.vulkan.org/tutorial/latest/00_Introduction.html" >tutorial</a>. 
        This serves as a guide to making a simple boilerplate and a refresher for many key concepts and design decisions of Vulkan mainly for myself. 
        There are many Vulkan guides out there, even Alexander Overvoorde's previous tutorial on the same subject looks quite differnt from the official one on the Vulkan docs.
        However, by jotting down some important bits here, we can utilize these notes to focus on quick setups and refreshers.
        </p>

        <p>
        For Vulkan, there are many possible ways and design philosophies we can choose. 
        Historically, we could create many Vulkan objects by utilizing commands with the format "vkCreateXXX" and the like.
        However, we would also need to destroy them with the similar "vkDestroyXXX". 
        Now we also have the option of using Vulkan's RAII module, where we combine all these functions into one, which nearly cuts our lines of code by half.
        What was previously known as the thousand lines for Vulkan's simple boilerplate code now becomes 500!
        </p>

        <p>
            Taking this directly from Vulkan docs we go from this:
        </p>
        <Code>{code1}</Code>

        To this:
        <Code>{code2}</Code>

        As a result, I will be using the RAII module versions of the guide. 
        <p>We now start with the basic skeleton</p>
        <Code>{skeleton}</Code>
    </div>
}