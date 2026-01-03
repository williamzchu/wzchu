import Code from "../../Code";
import CodeFunc from "../../CodeFunc";

export default function Textures() {
    return <div>
<p>To create a texture, we have to create an image object, and fill it's pixels from an image file. Then we create a sampler and use a sampler descriptor to sample colors from the texture.</p>

<p>Previously, we had images that were created by the swap chain. To create one, it similar as before, querying memory requirements, allocating device memory, and binding. 
    However, another aspect of images is that there are different layouts that affect how pixels are organized in memory. 
    These are under the <CodeFunc>VK_IMAGE_LAYOUT</CodeFunc> prefix. 
    Now a common way to transition the layout of an image is with a "pipeline barrier." 
    Although they are usually for synchronizing accesses to resources, they can also be used to transition layouts.
</p>

<p>We first load our texture image. 
<Code>
{`#define STB_IMAGE_IMPLEMENTATION
#include <stb_image.h>

void initVulkan() {
    ...
    createCommandPool();
    createTextureImage();
    createVertexBuffer();
    ...
}

void createTextureImage() {
    int texWidth, texHeight, texChannels;
    stbi_uc* pixels = stbi_load("textures/texture.jpg", &texWidth, &texHeight, &texChannels, STBI_rgb_alpha);
    vk::DeviceSize imageSize = texWidth * texHeight * 4;

    if (!pixels) {
        throw std::runtime_error("failed to load texture image!");
    }
}`}    
</Code>

We then create a staging buffer in host visible memory and copy pixels to it using <CodeFunc>vkMapMemory</CodeFunc>. 
The buffer we create needs to be in host visible memory so we can map it, and usable as a transfer source so we use those flags accordingly.

Then we can copy the pixels values to the buffer and clean up the original pixel array.

<Code>
{`vk::raii::Buffer stagingBuffer({});
vk::raii::DeviceMemory stagingBufferMemory({});

createBuffer(imageSize, vk::BufferUsageFlagBits::eTransferSrc, vk::MemoryPropertyFlagBits::eHostVisible | vk::MemoryPropertyFlagBits::eHostCoherent, stagingBuffer, stagingBufferMemory);

void* data = stagingBufferMemory.mapMemory(0, imageSize);
memcpy(data, pixels, imageSize);
stagingBufferMemory.unmapMemory();

// cleanup pixel arrays
stbi_image_free(pixels);`}
</Code>

</p>

<p>Now although we can simply set up a shader to access these pixel values that are in the buffer, it is better to use image obejcts for this purpose.
    Image objects make it easier and faster to retrieve by allowing us to use 2D coordinates.

    Therefore we make a funciton to create images:

    <Code>
{`void createImage(uint32_t width, uint32_t height, vk::Format format, vk::ImageTiling tiling, vk::ImageUsageFlags usage, vk::MemoryPropertyFlags properties, vk::raii::Image& image, vk::raii::DeviceMemory& imageMemory) {
    vk::ImageCreateInfo imageInfo{ .imageType = vk::ImageType::e2D, .format = format,
        .extent = {width, height, 1}, .mipLevels = 1, .arrayLayers = 1,
        .samples = vk::SampleCountFlagBits::e1, .tiling = tiling,
        .usage = usage, .sharingMode = vk::SharingMode::eExclusive };

    image = vk::raii::Image(device, imageInfo);

    vk::MemoryRequirements memRequirements = image.getMemoryRequirements();
    vk::MemoryAllocateInfo allocInfo{ .allocationSize = memRequirements.size,
                                        .memoryTypeIndex = findMemoryType(memRequirements.memoryTypeBits, properties) };
    imageMemory = vk::raii::DeviceMemory(device, allocInfo);
    image.bindMemory(imageMemory, 0);
}`}
    </Code>

    We can then use this in creating a texture image.
</p>

<p>Images in Vulkan can exist in different layouts that affect how the pixel data is organized in memory. 
   Layouts are optimized for specific tasks. Now for our texture image, we need to do several transitions.
   It has an initial undefined layout that we will need to transition to a layout optimized for receiving data.
   Then we need to transition it to a layout optimized for shader reading for our fragment shader.
   Again, we do these transitions using pipeline barriers, which not only change the layout, but also ensures proper synchronization between image access operations.

   This synchronization is important, as we wouldn't want a shader reading from a texture before it has finished a copy operation.
</p>
<p>We will therefore write functions for recording and executing a command buffer, but for a command that is called singly.
<Code>
{`vk::raii::CommandBuffer beginSingleTimeCommands() {
    vk::CommandBufferAllocateInfo allocInfo{ .commandPool = commandPool, .level = vk::CommandBufferLevel::ePrimary, .commandBufferCount = 1 };
    vk::raii::CommandBuffer commandBuffer = std::move(device.allocateCommandBuffers(allocInfo).front());

    vk::CommandBufferBeginInfo beginInfo{ .flags = vk::CommandBufferUsageFlagBits::eOneTimeSubmit };
    commandBuffer.begin(beginInfo);

    return commandBuffer;
}

void endSingleTimeCommands(vk::raii::CommandBuffer& commandBuffer) {
    commandBuffer.end();

    vk::SubmitInfo submitInfo{ .commandBufferCount = 1, .pCommandBuffers = &*commandBuffer };
    graphicsQueue.submit(submitInfo, nullptr);
    graphicsQueue.waitIdle();
}`}
</Code>

<p>
First we create a helper function to copy buffers to images.
<Code>
{`void copyBufferToImage(const vk::raii::Buffer& buffer, vk::raii::Image& image, uint32_t width, uint32_t height) {
    vk::raii::CommandBuffer commandBuffer = beginSingleTimeCommands();

    vk::BufferImageCopy region{ .bufferOffset = 0, .bufferRowLength = 0, .bufferImageHeight = 0,
.imageSubresource = { vk::ImageAspectFlagBits::eColor, 0, 0, 1 }, .imageOffset = {0, 0, 0}, .imageExtent = {width, height, 1} };
    commandBuffer.copyBufferToImage(buffer, image, vk::ImageLayout::eTransferDstOptimal, { region });

    endSingleTimeCommands(commandBuffer);
}`}</Code>

This assumes the image is already transitioned to the layout that is optimal for copying to.
</p>

<p>Now we can create a function to transition the image layout. 
If we were using buffers, we could simply execute <CodeFunc>vkCmdCopyBufferToImage</CodeFunc>. However, this requires the image to be in the right layout.
The common way to do this is using image memory barriers. This pipeline barrier is generally used to synchronize resource access, but can also be used to transition layouts.
<Code>
{`void transitionImageLayout(const vk::raii::Image& image, vk::ImageLayout oldLayout, vk::ImageLayout newLayout) {
    auto commandBuffer = beginSingleTimeCommands();

    vk::ImageMemoryBarrier barrier{ .oldLayout = oldLayout, .newLayout = newLayout, .image = image, .subresourceRange = { vk::ImageAspectFlagBits::eColor, 0, 1, 0, 1 } };

    vk::PipelineStageFlags sourceStage;
    vk::PipelineStageFlags destinationStage;

    if (oldLayout == vk::ImageLayout::eUndefined && newLayout == vk::ImageLayout::eTransferDstOptimal)
    {
        barrier.srcAccessMask = {};
        barrier.dstAccessMask = vk::AccessFlagBits::eTransferWrite;

        sourceStage = vk::PipelineStageFlagBits::eTopOfPipe;
        destinationStage = vk::PipelineStageFlagBits::eTransfer;
    }
    else if (oldLayout == vk::ImageLayout::eTransferDstOptimal && newLayout == vk::ImageLayout::eShaderReadOnlyOptimal)
    {
        barrier.srcAccessMask = vk::AccessFlagBits::eTransferWrite;
        barrier.dstAccessMask = vk::AccessFlagBits::eShaderRead;

        sourceStage = vk::PipelineStageFlagBits::eTransfer;
        destinationStage = vk::PipelineStageFlagBits::eFragmentShader;
    }
    else
    {
        throw std::invalid_argument("unsupported layout transition!");
    }

    commandBuffer.pipelineBarrier(sourceStage, destinationStage, {}, {}, nullptr, barrier);

    endSingleTimeCommands(commandBuffer);
}`}
</Code>
Here, we have two transitions to handle. The first one is from undefined to transfer destination, so transfer writes don't need to wait on anything. 
Therefore we can specify an empty access, and top of the pipe for pre barrier operations.

We also have a transition from transfer destination to shader reading, which should wait on the transfer writes, specifically the shader reads.
</p>


<p>Now we can return to our <CodeFunc>createTextureImage</CodeFunc> and transition our layouts before copying and before shader reading.
<Code>
{`transitionImageLayout(textureImage, vk::ImageLayout::eUndefined, vk::ImageLayout::eTransferDstOptimal);
copyBufferToImage(stagingBuffer, textureImage, static_cast<uint32_t>(texWidth), static_cast<uint32_t>(texHeight));
    
transitionImageLayout(textureImage, vk::ImageLayout::eTransferDstOptimal, vk::ImageLayout::eShaderReadOnlyOptimal);`}
</Code>

<p>Since images are accessed through image views, we will still need to create an image view for the texture image.
<Code>
{`void createTextureImageView() {
    textureImageView = createImageView(textureImage, vk::Format::eR8G8B8A8Srgb);
}

vk::raii::ImageView createImageView(vk::raii::Image& image, vk::Format format) {
    vk::ImageViewCreateInfo viewInfo{ .image = image, .viewType = vk::ImageViewType::e2D,
        .format = format, .subresourceRange = { vk::ImageAspectFlagBits::eColor, 0, 1, 0, 1 } };
    return vk::raii::ImageView(device, viewInfo);
}`}
</Code>

</p>

</p>

</p>

<p>
    Next we create samplers for the texture. Texture texels could be read by the shaders directly, but that is not very common and is usually accessed through samplers.
    This is due to samplers having filters that deal with problems like oversampling and undersampling to provide smoother results. Samplers can also take care of transformations.
<Code>
{`void createTextureSampler() {
    vk::SamplerCreateInfo samplerInfo{ .magFilter = vk::Filter::eLinear, .minFilter = vk::Filter::eLinear,  .mipmapMode = vk::SamplerMipmapMode::eLinear, .addressModeU = vk::SamplerAddressMode::eRepeat, .addressModeV = vk::SamplerAddressMode::eRepeat };
    vk::PhysicalDeviceProperties properties = physicalDevice.getProperties();
    vk::SamplerCreateInfo samplerInfo{ .magFilter = vk::Filter::eLinear, .minFilter = vk::Filter::eLinear,  .mipmapMode = vk::SamplerMipmapMode::eLinear,
        .addressModeU = vk::SamplerAddressMode::eRepeat, .addressModeV = vk::SamplerAddressMode::eRepeat, .addressModeW = vk::SamplerAddressMode::eRepeat,
        .anisotropyEnable = vk::True, .maxAnisotropy = properties.limits.maxSamplerAnisotropy };
}`}</Code>
</p>


    </div>
}